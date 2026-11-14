import { cardId, newReviewState, schedule } from '../domain/srs';
import type { StudyItem } from '../domain/study';
import type { Grade, ReviewState } from '../domain/types';
import type { BjjDB } from './db';

export function createReviewRepository(db: BjjDB) {
  return {
    /** Apply a grade to a card: reschedule it and append to the history, atomically. */
    async recordReview(item: StudyItem, grade: Grade, now = Date.now()): Promise<ReviewState> {
      const id = cardId(item.kind, item.id);
      return db.transaction('rw', db.reviews, db.reviewLog, async () => {
        const previous = (await db.reviews.get(id)) ?? newReviewState(item.kind, item.id, now);
        const next = schedule(previous, grade, now);
        await db.reviews.put(next);
        await db.reviewLog.add({ cardId: id, grade, reviewedAt: now });
        return next;
      });
    },

    /** Forget all study progress. Items and videos are untouched. */
    async resetProgress(): Promise<void> {
      await db.transaction('rw', db.reviews, db.reviewLog, async () => {
        await db.reviews.clear();
        await db.reviewLog.clear();
      });
    },
  };
}
