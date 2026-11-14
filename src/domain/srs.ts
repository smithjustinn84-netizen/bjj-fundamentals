import type { Grade, ItemKind, ReviewState } from './types';

/** A simplified SM-2 scheduler. Pure functions so they are easy to test. */

export const DAY_MS = 24 * 60 * 60 * 1000;
/** "Again" brings a card back within the same session. */
export const RELEARN_MS = 10 * 60 * 1000;
const MIN_EASE = 1.3;

export function cardId(kind: ItemKind, itemId: string): string {
  return `${kind}:${itemId}`;
}

export function newReviewState(kind: ItemKind, itemId: string, now: number): ReviewState {
  return {
    id: cardId(kind, itemId),
    kind,
    itemId,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    due: now,
    lastReviewed: 0,
  };
}

export function schedule(prev: ReviewState, grade: Grade, now: number): ReviewState {
  let { ease, intervalDays, repetitions, lapses } = prev;

  if (grade === 'again') {
    return {
      ...prev,
      ease: Math.max(MIN_EASE, ease - 0.2),
      intervalDays: 0,
      repetitions: 0,
      lapses: lapses + 1,
      due: now + RELEARN_MS,
      lastReviewed: now,
    };
  }

  if (grade === 'hard') {
    ease = Math.max(MIN_EASE, ease - 0.15);
    intervalDays = repetitions === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
  } else if (grade === 'good') {
    intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(intervalDays * ease);
  } else {
    intervalDays = repetitions === 0 ? 4 : Math.round(intervalDays * ease * 1.3);
    ease = ease + 0.15;
  }
  // Never let a successful review shrink the interval below the previous one (except "hard").
  if (grade !== 'hard') intervalDays = Math.max(intervalDays, prev.intervalDays + 1);

  return {
    ...prev,
    ease,
    intervalDays,
    repetitions: repetitions + 1,
    lapses,
    due: now + intervalDays * DAY_MS,
    lastReviewed: now,
  };
}

/** Human-friendly preview of when a card would come back, for the grade buttons. */
export function describeInterval(prev: ReviewState, grade: Grade, now: number): string {
  const next = schedule(prev, grade, now);
  const ms = next.due - now;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / 60000)}m`;
  const days = Math.round(ms / DAY_MS);
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/** A card counts as "learned" once it has survived a multi-day interval. */
export function isLearned(state: ReviewState | undefined): boolean {
  return !!state && state.intervalDays >= 3;
}

export function localDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Consecutive days (ending today, or yesterday if nothing yet today) with at least one review. */
export function streakDays(reviewTimestamps: number[], now: number): number {
  const days = new Set(reviewTimestamps.map(localDayKey));
  const cursor = new Date(now);
  if (!days.has(localDayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
