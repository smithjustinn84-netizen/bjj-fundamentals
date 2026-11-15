import type { BackupData } from './backup';
import type { ReviewLogEntry } from './models';
import type { AppStorage, Repository, ReviewLogRepository, StorageOptions } from './storage';

/**
 * A complete AppStorage that keeps everything in memory. Used by the core tests (no database needed)
 * and as the simplest reference for anyone writing a new engine. Not for production: nothing is persisted,
 * and overlapping transactions are not isolated from each other.
 */

/** Rows are plain JSON, so a JSON round trip is a safe deep copy. Copies stop callers sharing objects with the store. */
function copy<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

interface State {
  data: BackupData;
  nextLogId: number;
}

function initialState(initialData: BackupData): State {
  const data = copy(initialData);
  const highestId = data.reviewLog.reduce((max, entry) => Math.max(max, entry.id ?? 0), 0);
  return { data, nextLogId: highestId + 1 };
}

export function createMemoryStorage({ initialData }: StorageOptions): AppStorage {
  let state = initialState(initialData);
  let openTransactions = 0;
  const listeners = new Set<() => void>();

  function changed() {
    // Inside a transaction nothing is committed yet; `transaction` notifies once at the end.
    if (openTransactions > 0) return;
    for (const listener of [...listeners]) listener();
  }

  function repository<K extends Exclude<keyof BackupData, 'reviewLog'>>(table: K): Repository<BackupData[K][number]> {
    type Row = BackupData[K][number];
    // Safe: `table` indexes BackupData, so its rows are exactly `Row`; TypeScript cannot follow the generic index.
    const rows = () => state.data[table] as Row[];
    const upsert = (row: Row) => {
      const list = rows();
      const index = list.findIndex((existing) => existing.id === row.id);
      if (index >= 0) list[index] = copy(row);
      else list.push(copy(row));
    };
    return {
      all: async () => copy(rows()),
      get: async (id) => copy(rows().find((row) => row.id === id)),
      count: async () => rows().length,
      async put(row) {
        upsert(row);
        changed();
      },
      async putMany(many) {
        many.forEach(upsert);
        changed();
      },
      async remove(id) {
        (state.data[table] as Row[]) = rows().filter((row) => row.id !== id);
        changed();
      },
      async clear() {
        (state.data[table] as Row[]) = [];
        changed();
      },
    };
  }

  const appendLog = (entry: ReviewLogEntry) => {
    const id = entry.id ?? state.nextLogId;
    state.nextLogId = Math.max(state.nextLogId, id + 1);
    state.data.reviewLog.push({ ...copy(entry), id });
  };

  const reviewLog: ReviewLogRepository = {
    all: async () => copy(state.data.reviewLog),
    since: async (timestamp) => copy(state.data.reviewLog.filter((entry) => entry.reviewedAt > timestamp)),
    count: async () => state.data.reviewLog.length,
    async add(entry) {
      appendLog(entry);
      changed();
    },
    async putMany(rows) {
      rows.forEach(appendLog);
      changed();
    },
    async clear() {
      state.data.reviewLog = [];
      changed();
    },
  };

  return {
    concepts: repository('concepts'),
    positions: repository('positions'),
    transitions: repository('transitions'),
    videos: repository('videos'),
    reviews: repository('reviews'),
    reviewLog,
    starterDismissals: repository('starterDismissals'),

    async transaction(work) {
      const before = openTransactions === 0 ? copy(state) : null;
      openTransactions += 1;
      try {
        const result = await work();
        openTransactions -= 1;
        changed();
        return result;
      } catch (error) {
        openTransactions -= 1;
        // Only the outermost transaction holds a snapshot; it undoes everything, nested writes included.
        if (before) state = before;
        throw error;
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async reset() {
      state = initialState(initialData);
      changed();
    },
  };
}
