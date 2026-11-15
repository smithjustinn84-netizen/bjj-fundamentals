import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import type { ReviewState } from './models';
import { DAY_MS } from './srs';
import { buildQueue, cardName, progressSummary, stickingPoints } from './study';
import { concept, position, review, transition } from './testing/testFixtures';

const NOW = 1_000_000_000_000;

/** Cards here are due now unless a test says otherwise. */
const card = (kind: ReviewState['kind'], itemId: string, patch: Partial<ReviewState>) =>
  review(kind, itemId, { due: NOW, ...patch });

const concepts = [concept({ id: 'c1', order: 1 }), concept({ id: 'c2', order: 2 }), concept({ id: 'c3', order: 3 })];
const positions = [position({ id: 'p1' })];
const transitions = [transition({ id: 't1' })];

describe('buildQueue', () => {
  it('puts due cards first (most overdue first), then new cards in learning order up to the limit', () => {
    const lib = buildLibrary(concepts, positions, transitions, [
      card('position', 'p1', { due: NOW - DAY_MS }),
      card('concept', 'c3', { due: NOW - 3 * DAY_MS }),
      card('concept', 'c1', { due: NOW + DAY_MS }), // not due yet: excluded
    ]);
    const { queue, due, fresh } = buildQueue(lib, 'all', 1, NOW);
    expect(due.map((i) => i.id)).toEqual(['c3', 'p1']);
    // The one technique is a sweep, so the bottom side of its position has a situation card too.
    expect(fresh.map((i) => i.id)).toEqual(['c2', 't1', 'p1:bottom']);
    expect(queue.map((i) => i.id)).toEqual(['c3', 'p1', 'c2']);
  });

  it('filters by deck', () => {
    const lib = buildLibrary(concepts, positions, transitions, []);
    expect(buildQueue(lib, 'transition', 10, NOW).queue).toEqual([{ kind: 'transition', id: 't1' }]);
  });

  it('keeps the blue belt deck to techniques on the test list', () => {
    const techniques = [
      transition({ id: 'listed', blueBeltTest: true }),
      transition({ id: 'unlisted', blueBeltTest: false }),
    ];
    const lib = buildLibrary(concepts, positions, techniques, []);
    expect(buildQueue(lib, 'blueBelt', 10, NOW).queue).toEqual([{ kind: 'transition', id: 'listed' }]);
  });

  it('puts the new cards the training log names first, in its order', () => {
    const techniques = [
      transition({ id: 't1', name: 'A' }),
      transition({ id: 't2', name: 'B' }),
      transition({ id: 't3', name: 'C' }),
    ];
    const lib = buildLibrary(concepts, positions, techniques, [card('transition', 't2', { due: NOW + DAY_MS })]);
    // t2 was practised too, but it is already being studied and not due: only fresh cards jump the queue.
    const result = buildQueue(lib, 'all', 2, NOW, ['transition:t3', 'transition:t2', 'transition:t1']);
    expect(result.queue.map((i) => i.id)).toEqual(['t3', 't1']);
    expect(result.fromClass).toBe(2);
    expect(result.fresh.map((i) => i.id)).toEqual(['t3', 't1', 'c1', 'c2', 'c3', 'p1', 'p1:bottom']);
    expect(buildQueue(lib, 'concept', 2, NOW, ['transition:t3']).fromClass).toBe(0);
  });

  it('has a situations deck with one card per side of a position that has options, after the techniques', () => {
    const lib = buildLibrary(concepts, positions, transitions, []);
    expect(buildQueue(lib, 'situation', 10, NOW).queue).toEqual([{ kind: 'situation', id: 'p1:bottom' }]);
    expect(buildQueue(lib, 'all', 10, NOW).queue.at(-1)).toEqual({ kind: 'situation', id: 'p1:bottom' });
  });

  it('adds no new cards when the limit is zero', () => {
    const lib = buildLibrary(concepts, positions, transitions, []);
    expect(buildQueue(lib, 'all', 0, NOW).queue).toEqual([]);
  });
});

describe('progressSummary', () => {
  it('counts started and learned cards', () => {
    const lib = buildLibrary(concepts, positions, transitions, [
      card('concept', 'c1', { intervalDays: 8 }),
      card('concept', 'c2', { intervalDays: 1 }),
    ]);
    expect(progressSummary(lib)).toEqual({ total: 6, started: 2, learned: 1, percentLearned: 17 });
  });

  it('is zero for an empty library', () => {
    expect(progressSummary(buildLibrary([], [], [], [])).percentLearned).toBe(0);
  });
});

describe('stickingPoints', () => {
  it('lists cards forgotten more than once and not learned, most forgotten first, then lowest ease', () => {
    const lib = buildLibrary(concepts, positions, transitions, [
      card('concept', 'c1', { lapses: 2, ease: 2.5, intervalDays: 1 }),
      card('concept', 'c2', { lapses: 3, ease: 2.5, intervalDays: 0 }),
      card('concept', 'c3', { lapses: 4, intervalDays: 8 }), // forgotten before, but learned again
      card('position', 'p1', { lapses: 0, intervalDays: 1 }), // never forgotten
      card('transition', 't1', { lapses: 2, ease: 1.3, intervalDays: 1 }),
      card('situation', 'p1:bottom', { lapses: 1, intervalDays: 0 }), // one miss is not a pattern yet
    ]);
    expect(stickingPoints(lib, 5).map((i) => i.id)).toEqual(['c2', 't1', 'c1']);
    expect(stickingPoints(lib, 1).map((i) => i.id)).toEqual(['c2']);
  });

  it('is empty before anything has been forgotten', () => {
    expect(stickingPoints(buildLibrary(concepts, positions, transitions, []), 5)).toEqual([]);
  });
});

describe('cardName', () => {
  it('names an item by its name and a situation by its position and side, or null once it is gone', () => {
    const lib = buildLibrary(concepts, positions, transitions, []);
    expect(cardName(lib, { kind: 'transition', id: 't1' })).toBe('Transition');
    expect(cardName(lib, { kind: 'situation', id: 'p1:bottom' })).toBe('Position, playing guard');
    expect(cardName(lib, { kind: 'situation', id: 'p1:top' })).toBeNull();
    expect(cardName(lib, { kind: 'concept', id: 'gone' })).toBeNull();
  });
});
