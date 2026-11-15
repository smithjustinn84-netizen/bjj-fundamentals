import type { BackupData } from './backup';
import type {
  Concept,
  Position,
  ReviewLogEntry,
  ReviewState,
  StarterDismissal,
  Transition,
  VideoBookmark,
} from './models';

/**
 * The storage contract. This is the ONLY thing a storage engine has to implement: IndexedDB today
 * (`src/storage/dexieStorage.ts`), native SQLite or a Capacitor plugin later. All app logic in
 * `core/services` is written against these interfaces and never against a concrete engine.
 *
 * The contract is deliberately small: plain reads and writes by id, plus one indexed read. Filtering,
 * sorting and cascades are done in core, so an engine needs no knowledge of the app's rules.
 *
 * Every implementation must pass the shared suite in `core/testing/storageContract.ts`.
 */

/** One collection of rows keyed by a string `id`. */
export interface Repository<T extends { id: string }> {
  all(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  count(): Promise<number>;
  /** Insert, or replace the row with the same id. */
  put(row: T): Promise<void>;
  putMany(rows: T[]): Promise<void>;
  /** Removing an id that does not exist is not an error. */
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/** The review history: append-only, with a numeric id assigned by the engine. */
export interface ReviewLogRepository {
  all(): Promise<ReviewLogEntry[]>;
  /** Entries with `reviewedAt` strictly after `timestamp`. Expected to be an indexed read. */
  since(timestamp: number): Promise<ReviewLogEntry[]>;
  count(): Promise<number>;
  add(entry: Omit<ReviewLogEntry, 'id'>): Promise<void>;
  /** Used when restoring a backup. Rows that carry an id keep it. */
  putMany(rows: ReviewLogEntry[]): Promise<void>;
  clear(): Promise<void>;
}

export interface AppStorage {
  readonly concepts: Repository<Concept>;
  readonly positions: Repository<Position>;
  readonly transitions: Repository<Transition>;
  readonly videos: Repository<VideoBookmark>;
  readonly reviews: Repository<ReviewState>;
  readonly reviewLog: ReviewLogRepository;
  readonly starterDismissals: Repository<StarterDismissal>;

  /**
   * Run `work` so that either all of its writes are stored or none are. If `work` rejects, every write it
   * made is undone and the rejection is passed on. Inside `work`, await only calls on this storage:
   * some engines (IndexedDB) end a transaction as soon as something else is awaited.
   */
  transaction<T>(work: () => Promise<T>): Promise<T>;

  /**
   * Register a listener that is called after any stored change is committed, including changes made
   * elsewhere (another tab or process) when the engine can detect them. Returns a function that unregisters it.
   */
  subscribe(listener: () => void): () => void;

  /** Delete everything and return to the initial data the storage was created with. */
  reset(): Promise<void>;
}

/**
 * What every engine's factory takes. `initialData` must be inserted exactly once, when the engine creates
 * a brand-new database, and never again (so items the user deletes stay deleted across restarts).
 */
export interface StorageOptions {
  initialData: BackupData;
}
