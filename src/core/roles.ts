import { assertNever } from './assertNever';
import type { Library } from './library';
import type { PositionCategory, PositionRole, Transition, TransitionType } from './models';
import { STARTER_ROLES } from './seed';

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

/**
 * Who does a technique, as their role in its starting position. Techniques stored before the field existed
 * fall back to the starter content's answer, then to the usual role for their type.
 */
export function performerRole(lib: Library, transition: Transition): PositionRole {
  return (
    transition.role ??
    STARTER_ROLES.get(transition.id) ??
    defaultRole(transition.type, lib.positionById.get(transition.fromId)?.category)
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
