import { assertNever } from './assertNever';
import type { Library } from './library';
import { endsTheRoll, type PositionCategory, type PositionRole, type Transition, type TransitionType } from './models';
import { STARTER_END_ROLES, STARTER_ROLES } from './seed';

/**
 * Who usually does a technique of this type, for one the user has not said. A sweep or escape is done by
 * the person underneath and a pass or takedown by the person attacking; a submission comes from the bottom
 * in a guard and from the top everywhere else.
 */
export function defaultRole(type: TransitionType, category: PositionCategory | undefined): PositionRole {
  switch (type) {
    case 'sweep':
    case 'escape':
      return 'bottom';
    case 'pass':
    case 'takedown':
    case 'transition':
      return 'top';
    case 'submission':
      return category === 'guard' ? 'bottom' : 'top';
    default:
      return assertNever(type);
  }
}

/** The part of a library these rules read. Narrow, so a component holding only the position lookup can ask. */
type Positions = Pick<Library, 'positionById'>;

/**
 * Who does a technique, as their role in its starting position. Techniques stored before the field existed
 * fall back to the starter content's answer, then to the usual role for their type.
 */
export function performerRole(lib: Positions, transition: Transition): PositionRole {
  return (
    transition.role ??
    STARTER_ROLES.get(transition.id) ??
    defaultRole(transition.type, lib.positionById.get(transition.fromId)?.category)
  );
}

/**
 * Which side a technique of this type usually leaves the person who did it on, for one the user has not said,
 * or null for one that `endsTheRoll`. A sweep, pass or takedown puts you on top, and anything else leaves you
 * on the side you started on.
 */
export function defaultEndRole(type: TransitionType, role: PositionRole): PositionRole | null {
  if (endsTheRoll(type)) return null;
  switch (type) {
    case 'sweep':
    case 'pass':
    case 'takedown':
      return 'top';
    case 'escape':
    case 'transition':
    case 'submission':
      return role;
    default:
      return assertNever(type);
  }
}

/**
 * Which side of the destination the person who did a technique ends up on, or null for one that `endsTheRoll`.
 * Techniques stored before the field existed fall back to the starter content's answer, then to the usual
 * side for their type.
 */
export function endRole(lib: Positions, transition: Transition): PositionRole | null {
  if (endsTheRoll(transition.type)) return null;
  return (
    transition.endRole ??
    STARTER_END_ROLES.get(transition.id) ??
    defaultEndRole(transition.type, performerRole(lib, transition))
  );
}

/** The techniques each person can do from a position, in library order. An empty list is a gap in the game. */
export type PositionOptions = Record<PositionRole, Transition[]>;

export function positionOptions(lib: Library, positionId: string): PositionOptions {
  const options: PositionOptions = { top: [], bottom: [] };
  for (const transition of lib.transitions) {
    if (transition.fromId === positionId) options[performerRole(lib, transition)].push(transition);
  }
  return options;
}
