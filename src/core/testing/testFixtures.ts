import type { Concept, ItemKind, Position, ReviewState, Transition } from '../models';
import { newReviewState } from '../srs';

/** Minimal valid entities for tests. Override only the fields a test cares about. */

export function concept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: 'c1',
    name: 'Concept',
    summary: '',
    keyPoints: [],
    drill: '',
    order: 1,
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

export function position(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p1',
    name: 'Position',
    category: 'guard',
    summary: '',
    topGoals: [],
    bottomGoals: [],
    conceptIds: [],
    order: 1,
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

export function transition(overrides: Partial<Transition> = {}): Transition {
  return {
    id: 't1',
    name: 'Transition',
    type: 'sweep',
    fromId: 'p1',
    toId: 'p1',
    steps: [],
    commonMistakes: [],
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/** A study card for an item, starting from a never-reviewed card due at time 0. */
export function review(kind: ItemKind, itemId: string, overrides: Partial<ReviewState> = {}): ReviewState {
  return { ...newReviewState(kind, itemId, 0), ...overrides };
}
