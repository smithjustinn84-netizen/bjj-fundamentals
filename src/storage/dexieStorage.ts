import Dexie, { type Transaction } from 'dexie';
import { BACKUP_TABLES } from '../core/backup';
import type { ReviewLogEntry } from '../core/models';
import type { AppStorage, Repository, ReviewLogRepository, StorageOptions } from '../core/storage';

/**
 * AppStorage on IndexedDB, through Dexie. This is the only file in the app that knows IndexedDB exists.
 *
 * Changing the schema:
 *  1. Never edit an existing `version(n)` block. Add `version(n + 1).stores({...})` listing only changed tables,
 *     with `.upgrade(tx => ...)` if existing rows need rewriting.
 *  2. Only indexed fields go in `stores()`. A new non-indexed field needs no version bump, but old rows will
 *     lack it, so give it a default in an upgrade or treat it as optional.
 *  3. Update the model in `core/models.ts` and its checks in `core/backup.ts`.
 */

const DEFAULT_DATABASE_NAME = 'bjj-fundamentals';

export interface DexieStorageOptions extends StorageOptions {
  /** IndexedDB database name. Tests pass a unique one. */
  name?: string;
}

function openDatabase(name: string, initialData: StorageOptions['initialData']): Dexie {
  const db = new Dexie(name);
  db.version(1).stores({
    positions: 'id, category, order, name',
    transitions: 'id, type, fromId, toId, name',
    concepts: 'id, order, name',
    videos: 'id, youtubeId, [linkedKind+linkedId], createdAt',
    reviews: 'id, kind, itemId, due',
    reviewLog: '++id, cardId, reviewedAt',
  });
  const seedMissingStarterVideos = async (tx: Transaction) => {
    const videos = tx.table<{ id: string }, string>('videos');
    const existingIds = new Set((await videos.toArray()).map((v) => v.id));
    const missing = initialData.videos.filter((v) => !existingIds.has(v.id));
    if (missing.length > 0) await videos.bulkAdd(missing);
  };
  db.version(2).stores({}).upgrade(seedMissingStarterVideos);
  db.version(3).stores({}).upgrade(seedMissingStarterVideos);
  db.version(4).stores({ starterDismissals: 'id' });
  // Fires only when the database is first created, which is exactly the "insert once" rule of StorageOptions.
  db.on('populate', (tx) => {
    for (const table of BACKUP_TABLES) tx.table(table).bulkAdd(initialData[table]);
  });
  return db;
}

export function createDexieStorage({ name = DEFAULT_DATABASE_NAME, initialData }: DexieStorageOptions): AppStorage {
  const db = openDatabase(name, initialData);
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of [...listeners]) listener();
  };

  // Dexie announces every committed write, from this tab or another, as a set of keys starting "idb://<name>/".
  const ownChanges = `idb://${name}/`;
  const onMutated = (changedParts: Record<string, unknown>) => {
    if (Object.keys(changedParts).some((part) => part.startsWith(ownChanges))) notify();
  };

  function repository<T extends { id: string }>(tableName: string): Repository<T> {
    const table = db.table<T, string>(tableName);
    return {
      all: () => table.toArray(),
      get: (id) => table.get(id),
      count: () => table.count(),
      put: async (row) => {
        await table.put(row);
      },
      putMany: async (rows) => {
        await table.bulkPut(rows);
      },
      remove: (id) => table.delete(id),
      clear: () => table.clear(),
    };
  }

  const log = db.table<ReviewLogEntry, number>('reviewLog');
  const reviewLog: ReviewLogRepository = {
    all: () => log.toArray(),
    since: (timestamp) => log.where('reviewedAt').above(timestamp).toArray(),
    count: () => log.count(),
    add: async (entry) => {
      await log.add(entry);
    },
    putMany: async (rows) => {
      await log.bulkPut(rows);
    },
    clear: () => log.clear(),
  };

  return {
    concepts: repository('concepts'),
    positions: repository('positions'),
    transitions: repository('transitions'),
    videos: repository('videos'),
    reviews: repository('reviews'),
    reviewLog,
    starterDismissals: repository('starterDismissals'),

    transaction: (work) => db.transaction('rw', db.tables, work),

    subscribe(listener) {
      if (listeners.size === 0) Dexie.on('storagemutated', onMutated);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) Dexie.on('storagemutated').unsubscribe(onMutated);
      };
    },

    async reset() {
      await db.delete();
      // Reopening an empty database runs `populate` again, restoring the initial data.
      await db.open();
      notify();
    },
  };
}
