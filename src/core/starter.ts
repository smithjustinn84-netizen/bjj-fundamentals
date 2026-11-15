import type { BackupData } from './backup';
import { type Concept, endsTheRoll, type Position, type StarterDismissal, type Transition } from './models';

export type StarterItems = Pick<BackupData, 'concepts' | 'positions' | 'transitions'>;

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

/** Whether a stored item is still in the state seeding left it in, with no user edits or notes. */
function isUnedited(item: { createdAt: number; updatedAt: number; notes: string }): boolean {
  return item.updatedAt === item.createdAt && item.notes === '';
}

/**
 * Stored starter items that have never been edited by the user, refreshed with the latest starter coaching copy
 * while keeping their original timestamps, concept links, and blue belt test flag.
 */
export function refreshStarterCopy(starter: StarterItems, stored: StarterItems): StarterItems {
  const conceptById = new Map(starter.concepts.map((c) => [c.id, c]));
  const positionById = new Map(starter.positions.map((p) => [p.id, p]));
  const transitionById = new Map(starter.transitions.map((t) => [t.id, t]));

  return {
    concepts: stored.concepts.flatMap((row) => {
      const fresh = conceptById.get(row.id);
      return fresh && isUnedited(row) ? [{ ...fresh, createdAt: row.createdAt, updatedAt: row.updatedAt }] : [];
    }),
    positions: stored.positions.flatMap((row) => {
      const fresh = positionById.get(row.id);
      return fresh && isUnedited(row)
        ? [{ ...fresh, conceptIds: row.conceptIds, createdAt: row.createdAt, updatedAt: row.updatedAt }]
        : [];
    }),
    transitions: stored.transitions.flatMap((row) => {
      const fresh = transitionById.get(row.id);
      return fresh && isUnedited(row)
        ? [{ ...fresh, blueBeltTest: row.blueBeltTest, createdAt: row.createdAt, updatedAt: row.updatedAt }]
        : [];
    }),
  };
}
