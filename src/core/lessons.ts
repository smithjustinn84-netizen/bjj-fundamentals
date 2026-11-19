import type { StudyItem } from './curriculum';
import { type Library, reviewOf } from './library';
import { POSITION_ROLES } from './models';
import { performerRole } from './roles';
import { findSituation, situationId } from './situations';
import { isLearned } from './srs';

/**
 * A class-sized lesson: a few concepts, the position they matter in and the techniques that use them, with a
 * script for practising them with a partner. Lessons are a lookup by starter id, not stored data, so they need
 * no migration; progress is worked out from the review state of the cards.
 */
export interface Lesson {
  id: string;
  title: string;
  summary: string;
  conceptIds: readonly string[];
  positionIds: readonly string[];
  transitionIds: readonly string[];
  /** About fifteen minutes with a partner, built from the drills of the lesson's techniques. */
  practice: string;
}

/** The foundation track, in the order a beginner should take it: day-one safety, survival, the guard, then the rest. */
export const FOUNDATION_LESSONS: readonly Lesson[] = [
  {
    id: 'first-day-on-the-mat',
    title: 'First day on the mat',
    summary: 'Tap early, fall safely, stand up in base, and be the kind of training partner people trust.',
    conceptIds: ['safety', 'breakfalls', 'training-partner', 'roll-to-learn'],
    positionIds: [],
    transitionIds: ['technical-stand-up'],
    practice:
      '3 minutes: tap-and-release drill on a slow armbar, stopping before the hips lift. 4 minutes: 10 back breakfalls and 10 side breakfalls on each side. 4 minutes: 10 technical stand-ups on each side. 4 minutes: flow-roll at 40% pace, agreeing on pace and any sore joints before you start.',
  },
  {
    id: 'surviving-underneath',
    title: 'Surviving underneath',
    summary: 'Stay calm under side control, build frames, and escape to guard or your knees.',
    conceptIds: ['breathing', 'frames', 'elbows-in'],
    positionIds: ['side-control'],
    transitionIds: ['side-control-escape', 'side-control-escape-knees', 'americana-defence'],
    practice:
      '3 minutes: partner holds side control at 30% weight while you only breathe slowly and build both frames. 5 minutes: 10 escapes to guard on each side. 4 minutes: partner blocks your bottom knee, 5 escapes to your knees on each side. 3 minutes: 5 americana defences on each side, tapping early to anything caught.',
  },
  {
    id: 'escaping-the-mount',
    title: 'Escaping the mount',
    summary: 'Two escapes that cover for each other: bridge and roll, and the elbow-knee escape.',
    conceptIds: ['bridge', 'hip-escape', 'positional-hierarchy'],
    positionIds: ['mount'],
    transitionIds: ['upa-escape', 'elbow-knee-escape'],
    practice:
      '2 minutes: solo bridges and shrimps. 5 minutes: 10 bridge-and-roll escapes on each side, partner posting a hand close. 5 minutes: 10 elbow-knee escapes on each side, partner basing wide. 3 minutes: partner picks either base without saying which, and you choose the escape that fits.',
  },
  {
    id: 'inside-the-closed-guard',
    title: 'Inside the closed guard',
    summary: 'Posture and base on top, kneeling and standing guard breaks, and the first two sweeps from the bottom.',
    conceptIds: ['posture', 'base', 'grips'],
    positionIds: ['closed-guard'],
    transitionIds: ['break-closed-guard', 'standing-guard-break', 'scissor-sweep', 'hip-bump-sweep'],
    practice:
      '3 minutes: hold posture inside the guard while your partner tries to pull you down. 4 minutes: 3 kneeling guard breaks and 3 standing guard breaks each. 4 minutes: 10 scissor sweeps each. 4 minutes: 10 hip bump sweeps each, partner sitting back on their heels.',
  },
  {
    id: 'closed-guard-sit-up-attacks',
    title: 'Closed guard: sit-up and collar attacks',
    summary:
      'Chain the hip bump reaction into the kimura and guillotine, and threaten the cross collar choke when they stay low.',
    conceptIds: ['action-reaction', 'two-on-one'],
    positionIds: ['closed-guard'],
    transitionIds: ['kimura-guard', 'guillotine-guard', 'cross-collar-guard'],
    practice:
      '3 minutes each, slowly and pausing for the tap: 5 kimuras, 5 guillotines, and 5 cross collar chokes per side. Last 6 minutes: run the hip-bump to kimura to guillotine chain at half speed as your partner posts or pulls back.',
  },
  {
    id: 'closed-guard-angle-attacks',
    title: 'Closed guard: cutting an angle',
    summary: 'Pivot off the centre line to chain the armbar, triangle, pendulum sweep, and omoplata.',
    conceptIds: ['angles', 'off-balancing'],
    positionIds: ['closed-guard'],
    transitionIds: ['armbar-guard', 'triangle-choke', 'pendulum-sweep', 'omoplata-guard'],
    practice:
      '3 minutes each, slowly and pausing for the tap: 5 armbars, 5 triangles, 5 pendulum sweeps, and 5 omoplatas per side. Last 3 minutes: partner stacks or pulls an arm out at half speed and you switch to the follow-up their reaction opens.',
  },
  {
    id: 'defending-inside-the-guard',
    title: 'Defending inside the guard',
    summary: 'Stop each closed guard submission at its first step, before it is locked.',
    conceptIds: ['defend-early', 'posture'],
    positionIds: ['closed-guard'],
    transitionIds: ['armbar-defence', 'triangle-defence', 'guillotine-defence', 'kimura-defence'],
    practice:
      '3 minutes each: partner sets up the armbar, triangle, guillotine and kimura to the halfway point and stops; you defend from there. Last 3 minutes: partner attacks with any of the four at half speed.',
  },
  {
    id: 'open-guard-and-passing',
    title: 'Open guard and passing',
    summary: 'Keep your feet and knees between you and them underneath; control the hips to pass on top.',
    conceptIds: ['distance', 'inside-position', 'hip-control', 'wedges'],
    positionIds: ['open-guard'],
    transitionIds: ['toreando-pass', 'double-under-pass', 'butterfly-sweep', 'tripod-sweep', 'guard-retention'],
    practice:
      '3 minutes: guard retention, partner walking round your legs at half speed. 3 minutes each: 5 toreando passes, 5 double-under passes, 5 butterfly sweeps, 5 tripod sweeps per person.',
  },
  {
    id: 'half-guard-and-side-control',
    title: 'Half guard and the side control pin',
    summary: 'Win the underhook and head position in half guard, then pin from side control and move to mount.',
    conceptIds: ['underhooks', 'head-position', 'pressure', 'face-your-opponent', 'crossface'],
    positionIds: ['half-guard', 'side-control'],
    transitionIds: [
      'knee-slice',
      'half-guard-to-mount',
      'half-to-full-guard',
      'half-guard-underhook-sweep',
      'knee-shield-sweep',
      'side-to-mount',
      'americana',
    ],
    practice:
      '2 minutes: from half guard, both fight only for the underhook. 5 minutes on top: 5 knee slice passes and 5 passes straight to mount each. 5 minutes underneath: 5 recoveries to full guard, 5 underhook sweeps and 5 knee shield sweeps each. 3 minutes: hold side control for 20 seconds, slide to mount, and finish 5 slow americanas each.',
  },
  {
    id: 'attacking-from-the-pins',
    title: 'Attacking from the pins',
    summary: 'Settle the pin first, then attack the neck and arms or take the back when they turn to escape.',
    conceptIds: ['position-before-submission'],
    positionIds: ['side-control', 'mount'],
    transitionIds: [
      'cross-collar-choke',
      'armbar-mount',
      'mount-to-back',
      'arm-triangle-mount',
      'kimura-side-control',
      'side-control-to-back',
      'americana-mount',
      'ezekiel-mount',
    ],
    practice:
      '3 minutes: hold side control, then mount, for 30 seconds each against half-strength escapes. 6 minutes from mount, slowly and stopping at the first resistance: 4 cross collar chokes, 4 armbars, 4 arm triangles, 4 back takes as they turn, plus 3 americanas and 3 Ezekiel chokes. 6 minutes from side control: 5 kimuras and 5 gift wraps to the back.',
  },
  {
    id: 'back-control',
    title: 'Back control',
    summary: 'Protect your neck and escape when your back is taken, then finish from the back yourself.',
    conceptIds: ['defend-early', 'two-on-one'],
    positionIds: ['back-control'],
    transitionIds: ['rear-naked-choke-defence', 'back-escape', 'rear-naked-choke', 'sliding-collar-choke'],
    practice:
      '3 minutes: partner on your back with a seatbelt tries only to get a hand to your neck while you win the hand fight with two hands on one. 4 minutes: 5 choke defences and 5 back escapes each. 4 minutes each, slowly and tapping early: 5 rear naked chokes, then 5 sliding collar chokes.',
  },
  {
    id: 'turtle-basics',
    title: 'Turtle',
    summary: 'Seal your elbows to your knees and get out underneath; break them down or take the back on top.',
    conceptIds: ['elbows-in', 'base'],
    positionIds: ['turtle'],
    transitionIds: ['turtle-recover-guard', 'turtle-sit-out', 'turtle-to-back', 'turtle-breakdown'],
    practice:
      '4 minutes underneath: 5 guard recoveries and 5 sit-outs on each side. 4 minutes on top: 5 back takes and 5 breakdowns to side control on each side. 7 minutes: positional rounds from turtle, resetting when bottom recovers guard or top secures side control or hooks.',
  },
  {
    id: 'standing-and-takedowns',
    title: 'Standing and takedowns',
    summary: 'Win grips and off-balance first, defend leg shots with a sprawl, and take the fight to the mat cleanly.',
    conceptIds: ['off-balancing', 'grips'],
    positionIds: ['standing'],
    transitionIds: ['pull-guard', 'double-leg', 'single-leg', 'hip-throw', 'sprawl'],
    practice:
      '3 minutes: grip fight standing and off-balance your partner without throwing. 4 minutes: 5 guard pulls each and 10 sprawls against slow shots. 8 minutes at walking pace: 5 double legs, 5 single legs, and 5 hip throw fit-ins on each side.',
  },
  {
    id: 'self-defense',
    title: 'Self-defense fundamentals',
    summary: 'Break common grabs, chokes, bear hugs, and headlocks using posture, base, and frames.',
    conceptIds: ['base', 'frames', 'distance'],
    positionIds: ['standing'],
    transitionIds: [
      'wrist-grab-release',
      'front-choke-defence',
      'bear-hug-escape',
      'standing-headlock-escape',
      'ground-headlock-escape',
    ],
    practice:
      '3 minutes each at controlled speed: 5 wrist grab releases, 5 front choke defences, 5 bear hug escapes, 5 standing headlock escapes, and 5 ground headlock escapes per side. Focus on dropping into base and building rigid frames before escaping.',
  },
];

export function findLesson(id: string | null): Lesson | undefined {
  return FOUNDATION_LESSONS.find((lesson) => lesson.id === id);
}

/**
 * A lesson's cards in the order they are taught: its first concept, its positions, its techniques one at a
 * time with a remaining concept after each, then the situation card for each side the lesson gave a technique
 * to. Items the library no longer has are left out.
 */
export function lessonCards(lib: Library, lesson: Lesson): StudyItem[] {
  const concepts = lesson.conceptIds.filter((id) => lib.conceptById.has(id));
  const positions = lesson.positionIds.filter((id) => lib.positionById.has(id));
  const techniques = lesson.transitionIds.flatMap((id) => {
    const technique = lib.transitionById.get(id);
    return technique ? [technique] : [];
  });
  const cards: StudyItem[] = [];
  const [firstConcept, ...otherConcepts] = concepts;
  if (firstConcept) cards.push({ kind: 'concept', id: firstConcept });
  cards.push(...positions.map((id) => ({ kind: 'position' as const, id })));
  for (let i = 0; i < Math.max(techniques.length, otherConcepts.length); i += 1) {
    const technique = techniques[i];
    const concept = otherConcepts[i];
    if (technique) cards.push({ kind: 'transition', id: technique.id });
    if (concept) cards.push({ kind: 'concept', id: concept });
  }
  for (const positionId of positions) {
    for (const role of POSITION_ROLES) {
      const taught = techniques.some((t) => t.fromId === positionId && performerRole(lib, t) === role);
      const id = situationId(positionId, role);
      if (taught && findSituation(lib, id)) cards.push({ kind: 'situation', id });
    }
  }
  return cards;
}

export interface LessonProgress {
  /** The lesson's cards. */
  total: number;
  /** How many of them have been reviewed at least once. */
  started: number;
  learned: number;
}

export function lessonProgress(lib: Library, lesson: Lesson): LessonProgress {
  const states = lessonCards(lib, lesson).map((card) => reviewOf(lib, card.kind, card.id));
  return {
    total: states.length,
    started: states.filter((state) => state !== undefined).length,
    learned: states.filter((state) => isLearned(state)).length,
  };
}

/** The first lesson with a card still to learn, or null once every lesson is learned or has no cards here. */
export function currentLesson(lib: Library): Lesson | null {
  return (
    FOUNDATION_LESSONS.find((lesson) => {
      const progress = lessonProgress(lib, lesson);
      return progress.learned < progress.total;
    }) ?? null
  );
}
