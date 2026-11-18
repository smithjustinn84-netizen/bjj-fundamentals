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
  ['americana-mount', 'americana-defence'],
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
    { id: 'omoplata-guard', when: 'when they post a hand on the mat beside your ribs' },
  ],
  [
    { id: 'upa-escape', when: 'when they reach for your collar or post a hand close' },
    { id: 'elbow-knee-escape', when: 'when they base out wide to stop the bridge' },
  ],
  [
    { id: 'side-control-escape', when: 'when space opens at your hip' },
    { id: 'side-control-escape-knees', when: 'when they block your bottom knee' },
  ],
  [
    { id: 'break-closed-guard', when: 'when their hips stay flat and you can wedge from your knees' },
    { id: 'standing-guard-break', when: 'when their ankles stay locked tight against the kneeling break' },
  ],
  [
    { id: 'cross-collar-guard', when: 'when they keep both hands low on your hips or belt' },
    { id: 'armbar-guard', when: 'when they bring a hand up to strip the collar grip' },
    { id: 'scissor-sweep', when: 'when they posture up away from the collar grip' },
  ],
  [
    { id: 'cross-collar-choke', when: 'when they keep their elbows tight to their ribs' },
    { id: 'ezekiel-mount', when: 'when they hand-fight your collar grips' },
    { id: 'americana-mount', when: 'when a wrist comes up beside their head to frame' },
    { id: 'arm-triangle-mount', when: 'when an arm crosses their centerline to frame or push your shoulder' },
    { id: 'armbar-mount', when: 'when they push your chest with a straight arm' },
    { id: 'mount-to-back', when: 'when they turn onto their side to escape' },
  ],
  [
    { id: 'americana', when: 'when their far wrist comes up beside their head' },
    { id: 'kimura-side-control', when: 'when their far arm pushes at your neck or shoulder' },
    { id: 'side-control-to-back', when: 'when their near arm crosses to push your face' },
    { id: 'side-to-mount', when: 'when their arms stay tucked and their hips stay flat' },
  ],
  [
    { id: 'rear-naked-choke', when: 'when they fight your lapel grips and leave the neck open' },
    { id: 'sliding-collar-choke', when: 'when they tuck their chin against the bare-arm choke' },
  ],
  [
    { id: 'rear-naked-choke-defence', when: 'when their choking arm is already threatening your neck' },
    {
      id: 'back-escape',
      when: 'when your hands control the choking wrist and you can clear your shoulders to the mat',
    },
  ],
  [
    { id: 'half-guard-underhook-sweep', when: 'when they press their weight in and leave the far armpit open' },
    { id: 'knee-shield-sweep', when: 'when they block the underhook and lean on your shield' },
    { id: 'half-to-full-guard', when: 'when they sit back to free their trapped leg' },
  ],
  [
    { id: 'knee-slice', when: 'when their bottom knee opens or a frame slips' },
    { id: 'half-guard-to-mount', when: 'when they clamp your ankle and lie flat under the crossface' },
  ],
  [
    { id: 'toreando-pass', when: 'when their knees are loose and you can stand out of reach' },
    { id: 'double-under-pass', when: 'when they pull you in and lift their legs high' },
  ],
  [
    { id: 'butterfly-sweep', when: 'when they kneel in front of you' },
    { id: 'tripod-sweep', when: 'when they stand up in your guard' },
  ],
  [
    { id: 'guard-retention', when: 'when they pressure in close and you need to keep your legs in front' },
    { id: 'technical-stand-up', when: 'when they back away and leave space to get back to your feet' },
  ],
  [
    { id: 'turtle-to-back', when: 'when a gap opens between their elbow and knee' },
    { id: 'turtle-breakdown', when: 'when they seal their elbows to their knees' },
  ],
  [
    { id: 'turtle-recover-guard', when: 'when they sit beside you without trapping your far hip' },
    { id: 'turtle-sit-out', when: 'when they lean their chest on your back with no hooks in' },
  ],
  [
    { id: 'double-leg', when: 'when they stand square with their feet level' },
    { id: 'single-leg', when: 'when one foot steps out in front' },
    { id: 'hip-throw', when: 'when they lean in and push forward' },
    { id: 'pull-guard', when: 'when they stall or win the wrestling exchange' },
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
