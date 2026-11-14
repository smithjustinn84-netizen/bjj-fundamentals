import { describe, expect, it } from 'vitest';
import { DAY_MS, RELEARN_MS } from '../srs';
import { TEST_NOW, testCore } from '../testing/testCore';

const card = { kind: 'concept', id: 'base' } as const;

describe('recordReview', () => {
  it('creates the card on first review and appends to the history', async () => {
    const { core, storage } = testCore();
    const next = await core.reviews.recordReview(card, 'good');
    expect(next).toMatchObject({ id: 'concept:base', intervalDays: 1, due: TEST_NOW + DAY_MS });
    expect(await storage.reviews.get('concept:base')).toEqual(next);
    expect(await storage.reviewLog.all()).toMatchObject([
      { cardId: 'concept:base', grade: 'good', reviewedAt: TEST_NOW },
    ]);
  });

  it('builds on the stored state for later reviews', async () => {
    const { core, clock } = testCore();
    await core.reviews.recordReview(card, 'good');
    clock.now += DAY_MS;
    expect(await core.reviews.recordReview(card, 'good')).toMatchObject({ repetitions: 2, intervalDays: 3 });
  });

  it('drives the due count and streak', async () => {
    const { core, clock } = testCore();
    clock.now = TEST_NOW - DAY_MS;
    await core.reviews.recordReview(card, 'again');
    expect(await core.queries.dueCount()).toBe(0);
    clock.now += RELEARN_MS;
    expect(await core.queries.dueCount()).toBe(1);

    clock.now = TEST_NOW;
    await core.reviews.recordReview({ kind: 'concept', id: 'posture' }, 'good');
    expect(await core.queries.studyStats()).toEqual({ dueCount: 1, streakDays: 2 });
  });
});

describe('resetProgress', () => {
  it('clears cards and history but keeps the items', async () => {
    const { core, storage } = testCore();
    await core.reviews.recordReview(card, 'good');

    await core.reviews.resetProgress();

    expect(await storage.reviews.count()).toBe(0);
    expect(await storage.reviewLog.count()).toBe(0);
    expect(await storage.concepts.get('base')).toBeDefined();
  });
});
