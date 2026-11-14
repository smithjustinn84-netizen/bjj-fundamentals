import { describe, expect, it } from 'vitest';
import { DAY_MS, RELEARN_MS } from '../domain/srs';
import { createQueries } from './queries';
import { createReviewRepository } from './reviewRepository';
import { freshDb } from './testDb';

const NOW = new Date(2026, 10, 14, 12).getTime();
const card = { kind: 'concept', id: 'base' } as const;

describe('recordReview', () => {
  it('creates the card on first review and appends to the history', async () => {
    const db = freshDb();
    const next = await createReviewRepository(db).recordReview(card, 'good', NOW);
    expect(next).toMatchObject({ id: 'concept:base', intervalDays: 1, due: NOW + DAY_MS });
    expect(await db.reviews.get('concept:base')).toEqual(next);
    expect(await db.reviewLog.toArray()).toMatchObject([{ cardId: 'concept:base', grade: 'good', reviewedAt: NOW }]);
  });

  it('builds on the stored state for later reviews', async () => {
    const reviews = createReviewRepository(freshDb());
    await reviews.recordReview(card, 'good', NOW);
    const second = await reviews.recordReview(card, 'good', NOW + DAY_MS);
    expect(second).toMatchObject({ repetitions: 2, intervalDays: 3 });
  });

  it('drives the due count and streak', async () => {
    const db = freshDb();
    const reviews = createReviewRepository(db);
    const queries = createQueries(db);
    await reviews.recordReview(card, 'again', NOW - DAY_MS);
    await reviews.recordReview({ kind: 'concept', id: 'posture' }, 'good', NOW);

    expect(await queries.dueCount(NOW - DAY_MS + RELEARN_MS)).toBe(1);
    expect(await queries.studyStats(NOW)).toEqual({ dueCount: 1, streakDays: 2 });
  });
});

describe('resetProgress', () => {
  it('clears cards and history but keeps the items', async () => {
    const db = freshDb();
    const reviews = createReviewRepository(db);
    await reviews.recordReview(card, 'good', NOW);

    await reviews.resetProgress();

    expect(await db.reviews.count()).toBe(0);
    expect(await db.reviewLog.count()).toBe(0);
    expect(await db.concepts.get('base')).toBeDefined();
  });
});
