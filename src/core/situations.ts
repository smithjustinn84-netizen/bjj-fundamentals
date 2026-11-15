import { roleLabel } from './labels';
import type { Library } from './library';
import { POSITION_ROLES, type Position, type PositionRole, type Transition } from './models';
import { positionOptions } from './roles';

/**
 * A situation is one side of one position: "under mount", "passing the closed guard". It is studied as a
 * card of its own, because knowing each technique is not the same as knowing which ones you have from here.
 */
export interface Situation {
  position: Position;
  role: PositionRole;
  /** What this person can do from here, in library order. Never empty: a side with nothing has no situation. */
  options: Transition[];
}

/** The id a situation's study card is stored under. The role comes last so a position id may hold any text. */
export function situationId(positionId: string, role: PositionRole): string {
  return `${positionId}:${role}`;
}

/** The position a situation id names, whether or not it still exists. */
export function situationPositionId(id: string): string {
  return id.slice(0, Math.max(0, id.lastIndexOf(':')));
}

/** The situation an id names, or null if its position is gone or that side has nothing to do there. */
export function findSituation(lib: Library, id: string): Situation | null {
  const position = lib.positionById.get(situationPositionId(id));
  const role = POSITION_ROLES.find((candidate) => id.endsWith(`:${candidate}`));
  if (!position || !role) return null;
  const options = positionOptions(lib, position.id)[role];
  return options.length > 0 ? { position, role, options } : null;
}

/** Every situation in the library: positions in learning order, each side that has something to do. */
export function allSituations(lib: Library): Situation[] {
  return lib.positions.flatMap((position) => {
    const options = positionOptions(lib, position.id);
    return POSITION_ROLES.filter((role) => options[role].length > 0).map((role) => ({
      position,
      role,
      options: options[role],
    }));
  });
}

/** "Mount, Bottom side": how a situation is named in lists and questions. */
export function situationName({ position, role }: Situation): string {
  return `${position.name}, ${roleLabel(position.category, role)} side`;
}
