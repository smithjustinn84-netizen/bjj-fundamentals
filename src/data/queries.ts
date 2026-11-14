import { buildLibrary, type Library } from '../domain/library';
import { DAY_MS, streakDays } from '../domain/srs';
import type { ItemKind, VideoBookmark } from '../domain/types';
import type { BjjDB } from './db';

/** How far back to look when computing the streak. Streaks longer than this are capped. */
const STREAK_WINDOW_DAYS = 400;

export interface StudyStats {
  dueCount: number;
  streakDays: number;
}

/** Read-only queries. Kept free of React so they can be tested against a throwaway database. */
export function createQueries(db: BjjDB) {
  return {
    async library(): Promise<Library> {
      const [concepts, positions, transitions, reviews] = await Promise.all([
        db.concepts.toArray(),
        db.positions.toArray(),
        db.transitions.toArray(),
        db.reviews.toArray(),
      ]);
      return buildLibrary(concepts, positions, transitions, reviews);
    },

    dueCount: (now = Date.now()) => db.reviews.where('due').belowOrEqual(now).count(),

    async studyStats(now = Date.now()): Promise<StudyStats> {
      const since = now - STREAK_WINDOW_DAYS * DAY_MS;
      const [dueCount, recent] = await Promise.all([
        db.reviews.where('due').belowOrEqual(now).count(),
        db.reviewLog.where('reviewedAt').above(since).toArray(),
      ]);
      return {
        dueCount,
        streakDays: streakDays(
          recent.map((r) => r.reviewedAt),
          now,
        ),
      };
    },

    /** Newest first. */
    videos: (): Promise<VideoBookmark[]> => db.videos.orderBy('createdAt').reverse().toArray(),

    /** Oldest first, for one item. */
    linkedVideos: (kind: ItemKind, id: string): Promise<VideoBookmark[]> =>
      db.videos.where('[linkedKind+linkedId]').equals([kind, id]).sortBy('createdAt'),
  };
}
