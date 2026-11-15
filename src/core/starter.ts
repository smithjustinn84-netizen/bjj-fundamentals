import { endsTheRoll, type Position, type StarterDismissal, type Transition } from './models';

/**
 * The starter techniques worth offering to a library: no stored technique has the same id, the positions
 * they connect still exist, and the user has not dismissed them. Starter content is only inserted when
 * storage is first created, so this is how techniques added to the app later reach a library that already
 * exists. Missing cannot tell "never had it" from "deleted it on purpose"; dismissing covers the second.
 */
export function findMissingStarterTechniques(
  starter: Transition[],
  stored: Transition[],
  positions: Position[],
  dismissed: StarterDismissal[],
): Transition[] {
  const skipIds = new Set([...stored, ...dismissed].map((row) => row.id));
  const positionIds = new Set(positions.map((p) => p.id));
  const hasEnds = (t: Transition) => positionIds.has(t.fromId) && (endsTheRoll(t.type) || positionIds.has(t.toId));
  return starter.filter((t) => !skipIds.has(t.id) && hasEnds(t));
}
