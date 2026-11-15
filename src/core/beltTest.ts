import { type Library, reviewOf } from './library';
import { TRANSITION_TYPES, type Transition, type TransitionType } from './models';
import { STARTER_BLUE_BELT_TEST_IDS } from './seed';
import { isLearned } from './srs';

/**
 * Whether a technique is on the blue belt test list. Techniques stored before the flag existed fall back
 * to the starter default, so an existing library shows the same list as a fresh one until the user edits it.
 */
export function isOnBlueBeltTest(transition: Transition): boolean {
  return transition.blueBeltTest ?? STARTER_BLUE_BELT_TEST_IDS.has(transition.id);
}

export interface BeltTestGroup {
  type: TransitionType;
  /** In library order: by starting position, then name. */
  techniques: Transition[];
}

export interface BeltTestList {
  /** One group per technique type that has something on the list, in `TRANSITION_TYPES` order. */
  groups: BeltTestGroup[];
  total: number;
  /** How many of the listed techniques have a learned study card. */
  learned: number;
}

/** The techniques on the blue belt test, grouped by type, with how many of them have been learned. */
export function blueBeltTestList(lib: Library): BeltTestList {
  const listed = lib.transitions.filter(isOnBlueBeltTest);
  const groups = TRANSITION_TYPES.map((type) => ({ type, techniques: listed.filter((t) => t.type === type) })).filter(
    (group) => group.techniques.length > 0,
  );
  const learned = listed.filter((t) => isLearned(reviewOf(lib, 'transition', t.id))).length;
  return { groups, total: listed.length, learned };
}
