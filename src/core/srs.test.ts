import { describe, expect, it } from 'vitest';
import {
  DAY_MS,
  describeInterval,
  isLearned,
  localDayKey,
  newReviewState,
  RELEARN_MS,
  schedule,
  streakDays,
} from './srs';

const NOW = new Date(2026, 10, 14, 12).getTime();

describe('schedule', () => {
  it('walks a new card through 1d, 3d, then ease-multiplied intervals', () => {
    let s = newReviewState('concept', 'base', NOW);
    s = schedule(s, 'good', NOW);
    expect(s.intervalDays).toBe(1);
    expect(s.due).toBe(NOW + DAY_MS);
    s = schedule(s, 'good', NOW);
    expect(s.intervalDays).toBe(3);
    s = schedule(s, 'good', NOW);
    expect(s.intervalDays).toBe(8); // round(3 * 2.5)
    expect(s.repetitions).toBe(3);
  });

  it('"again" resets repetitions, lowers ease, and brings the card back soon', () => {
    let s = schedule(schedule(newReviewState('position', 'mount', NOW), 'good', NOW), 'good', NOW);
    s = schedule(s, 'again', NOW);
    expect(s.repetitions).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeCloseTo(2.3);
    expect(s.due).toBe(NOW + RELEARN_MS);
  });

  it('never drops ease below 1.3', () => {
    let s = newReviewState('concept', 'x', NOW);
    for (let i = 0; i < 20; i++) s = schedule(s, 'again', NOW);
    expect(s.ease).toBe(1.3);
  });

  it('"easy" on a new card skips ahead and raises ease', () => {
    const s = schedule(newReviewState('concept', 'x', NOW), 'easy', NOW);
    expect(s.intervalDays).toBe(4);
    expect(s.ease).toBeCloseTo(2.65);
  });

  it('"hard" grows the interval slowly, lowers ease, and may keep the interval flat', () => {
    let s = schedule(newReviewState('concept', 'x', NOW), 'hard', NOW);
    expect(s.intervalDays).toBe(1);
    expect(s.ease).toBeCloseTo(2.35);
    s = schedule(s, 'hard', NOW);
    expect(s.intervalDays).toBe(1); // max(1, round(1 * 1.2))
  });

  it('"easy" on a reviewed card multiplies by ease and the easy bonus', () => {
    let s = schedule(newReviewState('concept', 'x', NOW), 'good', NOW);
    s = schedule(s, 'easy', NOW);
    expect(s.intervalDays).toBe(3); // round(1 * 2.5 * 1.3) = 3
    expect(s.ease).toBeCloseTo(2.65);
  });
});

describe('describeInterval', () => {
  const fresh = newReviewState('concept', 'x', NOW);
  it('shows minutes for "again", days otherwise', () => {
    expect(describeInterval(fresh, 'again', NOW)).toBe('10m');
    expect(describeInterval(fresh, 'good', NOW)).toBe('1d');
  });
  it('switches to months and years for long intervals', () => {
    expect(describeInterval({ ...fresh, repetitions: 5, intervalDays: 20 }, 'good', NOW)).toBe('2mo');
    expect(describeInterval({ ...fresh, repetitions: 5, intervalDays: 200 }, 'good', NOW)).toBe('1.4y');
  });
});

describe('isLearned', () => {
  it('needs a multi-day interval', () => {
    expect(isLearned(undefined)).toBe(false);
    expect(isLearned({ ...newReviewState('concept', 'x', NOW), intervalDays: 2 })).toBe(false);
    expect(isLearned({ ...newReviewState('concept', 'x', NOW), intervalDays: 3 })).toBe(true);
  });
});

describe('streakDays', () => {
  it('counts a day with a logged class like a day with a review', () => {
    // Reviewed today, trained yesterday, reviewed the day before: three days in a row.
    expect(streakDays([NOW, NOW - 2 * DAY_MS], NOW, [localDayKey(NOW - DAY_MS)])).toBe(3);
    expect(streakDays([], NOW, [localDayKey(NOW)])).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    const ts = [0, 1, 2].map((d) => NOW - d * DAY_MS);
    expect(streakDays(ts, NOW)).toBe(3);
  });
  it('still counts a streak that ended yesterday', () => {
    expect(streakDays([NOW - DAY_MS, NOW - 2 * DAY_MS], NOW)).toBe(2);
  });
  it('is zero with a gap', () => {
    expect(streakDays([NOW - 3 * DAY_MS], NOW)).toBe(0);
  });
});
