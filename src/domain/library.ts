import { assertNever } from './assertNever';
import type { Concept, ItemKind, Position, ReviewState, Transition } from './types';

/** An in-memory snapshot of everything the UI needs to render lists and look items up. */
export interface Library {
  concepts: Concept[];
  positions: Position[];
  transitions: Transition[];
  /** Keyed by card id (`kind:itemId`). */
  reviews: Map<string, ReviewState>;
  conceptById: Map<string, Concept>;
  positionById: Map<string, Position>;
  transitionById: Map<string, Transition>;
}

/** Sorts into learning order (transitions follow their starting position) and builds lookup maps. */
export function buildLibrary(
  concepts: Concept[],
  positions: Position[],
  transitions: Transition[],
  reviews: ReviewState[],
): Library {
  const byOrder = <T extends { order: number; name: string }>(a: T, b: T) =>
    a.order - b.order || a.name.localeCompare(b.name);
  const sortedConcepts = [...concepts].sort(byOrder);
  const sortedPositions = [...positions].sort(byOrder);
  const positionRank = new Map(sortedPositions.map((p, i) => [p.id, i]));
  const rank = (t: Transition) => positionRank.get(t.fromId) ?? Number.MAX_SAFE_INTEGER;
  const sortedTransitions = [...transitions].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return {
    concepts: sortedConcepts,
    positions: sortedPositions,
    transitions: sortedTransitions,
    reviews: new Map(reviews.map((r) => [r.id, r])),
    conceptById: new Map(sortedConcepts.map((c) => [c.id, c])),
    positionById: new Map(sortedPositions.map((p) => [p.id, p])),
    transitionById: new Map(sortedTransitions.map((t) => [t.id, t])),
  };
}

/** Display name of any item, or null if it no longer exists. */
export function itemName(lib: Library, kind: ItemKind, id: string): string | null {
  switch (kind) {
    case 'concept':
      return lib.conceptById.get(id)?.name ?? null;
    case 'position':
      return lib.positionById.get(id)?.name ?? null;
    case 'transition':
      return lib.transitionById.get(id)?.name ?? null;
    default:
      return assertNever(kind);
  }
}
