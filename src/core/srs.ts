import { assertNever } from './assertNever';
import type { Grade, ItemKind, ReviewState } from './models';

/** A simplified SM-2 scheduler. Pure functions so they are easy to test. */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
/** "Again" brings a card back within the same session. */
export const RELEARN_MS = 10 * MINUTE_MS;

/** SM-2's starting ease: each successful review multiplies the interval by roughly this much. */
const INITIAL_EASE = 2.5;
/** Ease never drops below this, so a card that was hard once can still grow its interval. */
const MIN_EASE = 1.3;
const AGAIN_EASE_PENALTY = 0.2;
const HARD_EASE_PENALTY = 0.15;
const EASY_EASE_BONUS = 0.15;
/** "Hard" grows the interval far more slowly than the ease would. */
const HARD_INTERVAL_FACTOR = 1.2;
/** "Easy" stretches the interval beyond what the ease alone would give. */
const EASY_INTERVAL_FACTOR = 1.3;
/** First intervals, in days, before the ease takes over. */
const FIRST_INTERVAL_DAYS = 1;
const SECOND_INTERVAL_DAYS = 3;
const FIRST_EASY_INTERVAL_DAYS = 4;
/** An interval this long means the card has stuck across several days. */
const LEARNED_INTERVAL_DAYS = 3;

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export function cardId(kind: ItemKind, itemId: string): string {
  return `${kind}:${itemId}`;
}

export function newReviewState(kind: ItemKind, itemId: string, now: number): ReviewState {
  return {
    id: cardId(kind, itemId),
    kind,
    itemId,
    ease: INITIAL_EASE,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    due: now,
    lastReviewed: 0,
  };
}

export function schedule(prev: ReviewState, grade: Grade, now: number): ReviewState {
  const { repetitions } = prev;
  let ease = prev.ease;
  let intervalDays: number;

  switch (grade) {
    case 'again':
      return {
        ...prev,
        ease: Math.max(MIN_EASE, ease - AGAIN_EASE_PENALTY),
        intervalDays: 0,
        repetitions: 0,
        lapses: prev.lapses + 1,
        due: now + RELEARN_MS,
        lastReviewed: now,
      };
    case 'hard':
      ease = Math.max(MIN_EASE, ease - HARD_EASE_PENALTY);
      intervalDays =
        repetitions === 0
          ? FIRST_INTERVAL_DAYS
          : Math.max(FIRST_INTERVAL_DAYS, Math.round(prev.intervalDays * HARD_INTERVAL_FACTOR));
      break;
    case 'good':
      intervalDays =
        repetitions === 0
          ? FIRST_INTERVAL_DAYS
          : repetitions === 1
            ? SECOND_INTERVAL_DAYS
            : Math.round(prev.intervalDays * ease);
      break;
    case 'easy':
      intervalDays =
        repetitions === 0 ? FIRST_EASY_INTERVAL_DAYS : Math.round(prev.intervalDays * ease * EASY_INTERVAL_FACTOR);
      ease += EASY_EASE_BONUS;
      break;
    default:
      return assertNever(grade);
  }
  // A successful review never leaves the interval where it was; "hard" is allowed to.
  if (grade !== 'hard') intervalDays = Math.max(intervalDays, prev.intervalDays + 1);

  return {
    ...prev,
    ease,
    intervalDays,
    repetitions: repetitions + 1,
    due: now + intervalDays * DAY_MS,
    lastReviewed: now,
  };
}

/** Human-friendly preview of when a card would come back, for the grade buttons. */
export function describeInterval(prev: ReviewState, grade: Grade, now: number): string {
  const next = schedule(prev, grade, now);
  const ms = next.due - now;
  if (ms < HOUR_MS) return `${Math.round(ms / MINUTE_MS)}m`;
  const days = Math.round(ms / DAY_MS);
  if (days < DAYS_PER_MONTH) return `${days}d`;
  if (days < DAYS_PER_YEAR) return `${Math.round(days / DAYS_PER_MONTH)}mo`;
  return `${(days / DAYS_PER_YEAR).toFixed(1)}y`;
}

/** A card counts as "learned" once it has survived a multi-day interval. */
export function isLearned(state: ReviewState | undefined): boolean {
  return !!state && state.intervalDays >= LEARNED_INTERVAL_DAYS;
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
