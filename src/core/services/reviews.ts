import type { CoreEnv } from '../core';
import type { Grade, ReviewState } from '../models';
import { cardId, newReviewState, schedule } from '../srs';
import type { StudyItem } from '../study';

export function createReviewService({ storage, now }: CoreEnv) {
  return {
    /** Apply a grade to a card: reschedule it and append to the history, atomically. */
    recordReview(item: StudyItem, grade: Grade): Promise<ReviewState> {
      const timestamp = now();
      const id = cardId(item.kind, item.id);
      return storage.transaction(async () => {
        const previous = (await storage.reviews.get(id)) ?? newReviewState(item.kind, item.id, timestamp);
        const next = schedule(previous, grade, timestamp);
        await storage.reviews.put(next);
        await storage.reviewLog.add({ cardId: id, grade, reviewedAt: timestamp });
        return next;
      });
    },

    /** Forget all study progress. Items and videos are untouched. */
    resetProgress(): Promise<void> {
      return storage.transaction(async () => {
        await storage.reviews.clear();
        await storage.reviewLog.clear();
      });
    },
  };
}
