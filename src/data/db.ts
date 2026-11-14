import Dexie, { type EntityTable } from 'dexie';
import { seedConcepts, seedPositions, seedTransitions } from '../domain/seed';
import type { Concept, Position, ReviewLogEntry, ReviewState, Transition, VideoBookmark } from '../domain/types';

/**
 * The IndexedDB schema. This file and the repositories next to it are the only code that knows about Dexie.
 *
 * Changing the schema:
 *  1. Never edit an existing `version(n)` block. Add `version(n + 1).stores({...})` listing only changed tables,
 *     with `.upgrade(tx => ...)` if existing rows need rewriting.
 *  2. Only indexed fields go in `stores()`. A new non-indexed field needs no version bump, but old rows will
 *     lack it, so give it a default in an upgrade or treat it as optional.
 *  3. Update the matching type in `domain/types.ts` and its checks in `domain/backup.ts`
 *     (and bump BACKUP_SCHEMA_VERSION if old backups need converting).
 */
export class BjjDB extends Dexie {
  positions!: EntityTable<Position, 'id'>;
  transitions!: EntityTable<Transition, 'id'>;
  concepts!: EntityTable<Concept, 'id'>;
  videos!: EntityTable<VideoBookmark, 'id'>;
  reviews!: EntityTable<ReviewState, 'id'>;
  reviewLog!: EntityTable<ReviewLogEntry, 'id'>;

  constructor(name = 'bjj-fundamentals') {
    super(name);
    this.version(1).stores({
      positions: 'id, category, order, name',
      transitions: 'id, type, fromId, toId, name',
      concepts: 'id, order, name',
      videos: 'id, youtubeId, [linkedKind+linkedId], createdAt',
      reviews: 'id, kind, itemId, due',
      reviewLog: '++id, cardId, reviewedAt',
    });

    // Fires only when the database is first created, so deleted starter items never come back.
    this.on('populate', (tx) => {
      const now = Date.now();
      tx.table('concepts').bulkAdd(seedConcepts(now));
      tx.table('positions').bulkAdd(seedPositions(now));
      tx.table('transitions').bulkAdd(seedTransitions(now));
    });
  }
}
