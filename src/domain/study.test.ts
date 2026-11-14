import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import { DAY_MS, newReviewState } from './srs';
import { buildQueue, progressSummary } from './study';
import { concept, position, transition } from './testFixtures';
import type { ReviewState } from './types';

const NOW = 1_000_000_000_000;

function review(kind: ReviewState['kind'], itemId: string, patch: Partial<ReviewState>): ReviewState {
  return { ...newReviewState(kind, itemId, NOW), ...patch };
}

const concepts = [concept({ id: 'c1', order: 1 }), concept({ id: 'c2', order: 2 }), concept({ id: 'c3', order: 3 })];
const positions = [position({ id: 'p1' })];
const transitions = [transition({ id: 't1' })];

describe('buildQueue', () => {
  it('puts due cards first (most overdue first), then new cards in learning order up to the limit', () => {
    const lib = buildLibrary(concepts, positions, transitions, [
      review('position', 'p1', { due: NOW - DAY_MS }),
      review('concept', 'c3', { due: NOW - 3 * DAY_MS }),
      review('concept', 'c1', { due: NOW + DAY_MS }), // not due yet: excluded
    ]);
    const { queue, due, fresh } = buildQueue(lib, 'all', 1, NOW);
    expect(due.map((i) => i.id)).toEqual(['c3', 'p1']);
    expect(fresh.map((i) => i.id)).toEqual(['c2', 't1']);
    expect(queue.map((i) => i.id)).toEqual(['c3', 'p1', 'c2']);
  });

  it('filters by deck', () => {
    const lib = buildLibrary(concepts, positions, transitions, []);
    expect(buildQueue(lib, 'transition', 10, NOW).queue).toEqual([{ kind: 'transition', id: 't1' }]);
  });

  it('adds no new cards when the limit is zero', () => {
    const lib = buildLibrary(concepts, positions, transitions, []);
    expect(buildQueue(lib, 'all', 0, NOW).queue).toEqual([]);
  });
});

describe('progressSummary', () => {
  it('counts started and learned cards', () => {
    const lib = buildLibrary(concepts, positions, transitions, [
      review('concept', 'c1', { intervalDays: 8 }),
      review('concept', 'c2', { intervalDays: 1 }),
    ]);
    expect(progressSummary(lib)).toEqual({ total: 5, started: 2, learned: 1, percentLearned: 20 });
  });

  it('is zero for an empty library', () => {
    expect(progressSummary(buildLibrary([], [], [], [])).percentLearned).toBe(0);
  });
});
