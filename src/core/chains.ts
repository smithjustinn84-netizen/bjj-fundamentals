import type { Library } from './library';
import type { Transition } from './models';

/**
 * How the starter techniques answer one another. Kept as a lookup by starter id, not as stored fields, so it
 * needs no migration and no backup change; a technique the user added has no links.
 */

/** An attack and the technique that defends it. */
const STARTER_DEFENCES: readonly (readonly [attackId: string, defenceId: string])[] = [
  ['armbar-guard', 'armbar-defence'],
  ['triangle-choke', 'triangle-defence'],
  ['guillotine-guard', 'guillotine-defence'],
  ['kimura-guard', 'kimura-defence'],
  ['americana', 'americana-defence'],
  ['rear-naked-choke', 'rear-naked-choke-defence'],
  ['double-leg', 'sprawl'],
  ['single-leg', 'sprawl'],
];

/**
 * Techniques that cover for each other: the reaction that stops one opens the next. `when` says what the
 * other person does that makes this the one to use, written to follow the technique's name.
 */
const STARTER_DILEMMAS: readonly (readonly { id: string; when: string }[])[] = [
  [
    { id: 'hip-bump-sweep', when: 'when they sit back on their heels' },
    { id: 'kimura-guard', when: 'when they post a hand on the mat to stop the bump' },
    { id: 'guillotine-guard', when: 'when they pull the arm back and leave the head low' },
  ],
  [
    { id: 'armbar-guard', when: 'when an arm crosses your centre line' },
    { id: 'triangle-choke', when: 'when they yank one arm free' },
    { id: 'pendulum-sweep', when: 'when they stack their weight into you' },
  ],
  [
    { id: 'upa-escape', when: 'when they reach for your collar or post a hand close' },
    { id: 'elbow-knee-escape', when: 'when they base out wide to stop the bridge' },
  ],
  [
    { id: 'side-control-escape', when: 'when space opens at your hip' },
    { id: 'side-control-escape-knees', when: 'when they block your bottom knee' },
  ],
];

export interface FollowUp {
  technique: Transition;
  /** What the other person does that makes this the technique to switch to. */
  when: string;
}

export interface TechniqueLinks {
  /** Techniques that defend this one. */
  defences: Transition[];
  /** Techniques this one defends. */
  answers: Transition[];
  /** What to switch to when this one is stopped. */
  followUps: FollowUp[];
}

/** How a technique connects to others in the library. Links to techniques the library no longer has are left out. */
export function techniqueLinks(lib: Library, id: string): TechniqueLinks {
  const held = (ids: string[]) =>
    ids.flatMap((other) => {
      const technique = lib.transitionById.get(other);
      return technique ? [technique] : [];
    });
  return {
    defences: held(STARTER_DEFENCES.filter(([attack]) => attack === id).map(([, defence]) => defence)),
    answers: held(STARTER_DEFENCES.filter(([, defence]) => defence === id).map(([attack]) => attack)),
    followUps: STARTER_DILEMMAS.filter((dilemma) => dilemma.some((member) => member.id === id))
      .flat()
      .flatMap((member) => {
        const technique = member.id === id ? undefined : lib.transitionById.get(member.id);
        return technique ? [{ technique, when: member.when }] : [];
      }),
  };
}

export function hasLinks(links: TechniqueLinks): boolean {
  return links.defences.length + links.answers.length + links.followUps.length > 0;
}
