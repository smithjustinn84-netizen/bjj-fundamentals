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

/** The foundation track, in the order a beginner should take it: survive, then the guard, then the rest. */
export const FOUNDATION_LESSONS: readonly Lesson[] = [
  {
    id: 'surviving-underneath',
    title: 'Surviving underneath',
    summary: 'Stay calm and safe under side control, build frames, and get back to guard.',
    conceptIds: ['safety', 'breathing', 'frames', 'elbows-in'],
    positionIds: ['side-control'],
    transitionIds: ['side-control-escape', 'americana-defence'],
    practice:
      '3 minutes: partner holds side control at 30% weight while you only breathe slowly and build both frames. 6 minutes: 10 escapes to guard on each side. 3 minutes: 5 americana defences on each side. 3 minutes: partner holds at 50% and you escape however you can, tapping early to anything caught.',
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
    summary: 'Posture and base on top, and the first two sweeps from the bottom.',
    conceptIds: ['posture', 'base', 'grips'],
    positionIds: ['closed-guard'],
    transitionIds: ['break-closed-guard', 'scissor-sweep', 'hip-bump-sweep'],
    practice:
      '3 minutes: hold posture inside the guard while your partner tries to pull you down. 4 minutes: 5 guard breaks each. 4 minutes: 10 scissor sweeps each. 4 minutes: 10 hip bump sweeps each, partner sitting back on their heels.',
  },
  {
    id: 'closed-guard-attacks',
    title: 'Attacking from the closed guard',
    summary: 'Four submissions that feed each other once you have an angle and two hands on one arm.',
    conceptIds: ['angles', 'two-on-one', 'action-reaction'],
    positionIds: ['closed-guard'],
    transitionIds: ['armbar-guard', 'triangle-choke', 'kimura-guard', 'guillotine-guard'],
    practice:
      '3 minutes each, slowly, pausing for the tap: armbar, triangle, kimura, guillotine. Last 3 minutes: partner defends the first attack at half speed and you switch to the one their reaction opens.',
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
    transitionIds: ['knee-slice', 'half-to-full-guard', 'half-guard-underhook-sweep', 'side-to-mount', 'americana'],
    practice:
      '3 minutes: from half guard, both fight only for the underhook. 3 minutes each: 5 knee slice passes, 5 recoveries to full guard, 5 underhook sweeps per person. 3 minutes: hold side control for 20 seconds, slide to mount, and finish 5 slow americanas each.',
  },
  {
    id: 'back-turtle-and-standing',
    title: 'Back control, turtle and standing safely',
    summary: 'Take and escape the back, deal with turtle, and get the fight to the ground without getting hurt.',
    conceptIds: ['position-before-submission', 'breakfalls', 'training-partner', 'roll-to-learn'],
    positionIds: ['back-control', 'turtle', 'standing'],
    transitionIds: [
      'rear-naked-choke',
      'back-escape',
      'rear-naked-choke-defence',
      'turtle-to-back',
      'turtle-recover-guard',
      'pull-guard',
      'double-leg',
      'sprawl',
    ],
    practice:
      '2 minutes: breakfalls. 4 minutes: from back control, 5 slow rear naked chokes each, then 5 choke defences and back escapes each. 4 minutes: 5 back takes from turtle and 5 guard recoveries each. 5 minutes: 5 guard pulls, then 5 double legs against 5 sprawls each, at walking pace.',
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
