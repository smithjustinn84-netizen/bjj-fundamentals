import type { Transition } from './models';
import { STARTER_DRILLS } from './seed';

/**
 * The drill for a technique, or '' when it has none. Techniques stored before the field existed fall back
 * to the starter content's drill; one the user has cleared stays cleared.
 */
export function techniqueDrill(transition: Transition): string {
  return transition.drill ?? STARTER_DRILLS.get(transition.id) ?? '';
}
