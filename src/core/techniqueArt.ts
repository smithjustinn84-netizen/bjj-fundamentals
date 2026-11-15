import type { Transition } from './models';

/**
 * Built-in escapes that finish with the person who was underneath on top. A sweep always does this,
 * so sweeps are not listed; these are the techniques of other types that do it too.
 */
const REVERSING_TECHNIQUE_IDS: ReadonlySet<string> = new Set(['upa-escape', 'back-escape']);

/**
 * Whether the two people swap places between the start and the end of a technique: the one who began
 * underneath, or controlled, finishes on top. A picture of the move needs this to know which person
 * in the start position becomes which person in the end position.
 */
export function reversesRoles(transition: Pick<Transition, 'id' | 'type'>): boolean {
  return transition.type === 'sweep' || REVERSING_TECHNIQUE_IDS.has(transition.id);
}
