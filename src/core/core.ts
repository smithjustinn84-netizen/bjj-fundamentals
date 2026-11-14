import { createBackupService } from './services/backups';
import { createItemService } from './services/items';
import { createQueries } from './services/queries';
import { createReviewService } from './services/reviews';
import { createVideoService } from './services/videos';
import type { AppStorage } from './storage';

/**
 * Everything the core needs from the outside world. Ids and the clock are passed in rather than read from
 * globals so the core runs unchanged in a browser, in Node, or in a native shell, and is deterministic in tests.
 */
export interface CoreEnv {
  storage: AppStorage;
  /** A new unique id each call, e.g. `() => crypto.randomUUID()`. */
  newId: () => string;
  /** The current time in epoch milliseconds, e.g. `Date.now`. */
  now: () => number;
}

/** The whole application minus its user interface. */
export function createCore(env: CoreEnv) {
  return {
    items: createItemService(env),
    videos: createVideoService(env),
    reviews: createReviewService(env),
    backups: createBackupService(env),
    queries: createQueries(env),
    /** Called after any stored change, so a UI knows when to re-run its queries. */
    subscribe: (listener: () => void) => env.storage.subscribe(listener),
  };
}

export type Core = ReturnType<typeof createCore>;
