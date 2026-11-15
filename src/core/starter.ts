import { endsTheRoll, type Position, type Transition } from './models';

/**
 * The starter techniques a library does not have and could hold: no stored technique has the same id, and
 * the positions they connect still exist. Starter content is only inserted when storage is first created,
 * so this is how techniques added to the app later reach a library that already exists.
 */
export function missingStarterTechniques(
  starter: Transition[],
  stored: Transition[],
  positions: Position[],
): Transition[] {
  const storedIds = new Set(stored.map((t) => t.id));
  const positionIds = new Set(positions.map((p) => p.id));
  const hasEnds = (t: Transition) => positionIds.has(t.fromId) && (endsTheRoll(t.type) || positionIds.has(t.toId));
  return starter.filter((t) => !storedIds.has(t.id) && hasEnds(t));
}
