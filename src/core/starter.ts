import { type Concept, endsTheRoll, type Position, type StarterDismissal, type Transition } from './models';

/**
 * Starter items worth offering to a library: no stored item of the same kind has the same id, and the user has
 * not dismissed them. Starter content is only inserted when storage is first created, so this is how items
 * added to the app later reach a library that already exists. Missing cannot tell "never had it" from "deleted
 * it on purpose"; dismissing covers the second.
 */
function notStoredOrDismissed<T extends { id: string }>(
  starter: T[],
  stored: { id: string }[],
  dismissed: StarterDismissal[],
): T[] {
  const skipIds = new Set([...stored, ...dismissed].map((row) => row.id));
  return starter.filter((item) => !skipIds.has(item.id));
}

/** Starter techniques to offer: missing, not dismissed, and the positions they connect still exist. */
export function findMissingStarterTechniques(
  starter: Transition[],
  stored: Transition[],
  positions: Position[],
  dismissed: StarterDismissal[],
): Transition[] {
  const positionIds = new Set(positions.map((p) => p.id));
  const hasEnds = (t: Transition) => positionIds.has(t.fromId) && (endsTheRoll(t.type) || positionIds.has(t.toId));
  return notStoredOrDismissed(starter, stored, dismissed).filter(hasEnds);
}

/** Starter concepts to offer: missing and not dismissed. */
export function findMissingStarterConcepts(
  starter: Concept[],
  stored: Concept[],
  dismissed: StarterDismissal[],
): Concept[] {
  return notStoredOrDismissed(starter, stored, dismissed);
}

/**
 * The stored positions that should list a newly added concept, with the concept appended: each starter position
 * whose starter version lists it, if the library still has that position and it does not list the concept yet.
 * Only ever adds links, so the user's own edits to a position's concepts are kept.
 */
export function linkAddedConcepts(
  addedConceptIds: ReadonlySet<string>,
  starterPositions: Position[],
  stored: Position[],
): Position[] {
  const starterById = new Map(starterPositions.map((p) => [p.id, p]));
  return stored.flatMap((position) => {
    const toAdd = (starterById.get(position.id)?.conceptIds ?? []).filter(
      (id) => addedConceptIds.has(id) && !position.conceptIds.includes(id),
    );
    return toAdd.length > 0 ? [{ ...position, conceptIds: [...position.conceptIds, ...toAdd] }] : [];
  });
}
