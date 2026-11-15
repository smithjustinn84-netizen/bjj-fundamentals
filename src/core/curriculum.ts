import type { Library } from './library';
import {
  type CardKind,
  type Concept,
  isEscape,
  isPin,
  POSITION_ROLES,
  type Position,
  type Transition,
  type TransitionType,
} from './models';
import { positionOptions } from './roles';
import { situationId } from './situations';

/** One thing that can be studied as a flashcard. */
export interface StudyItem {
  kind: CardKind;
  /** The item's id, or for a situation its `situationId`. */
  id: string;
}

/**
 * The order a position's techniques are taught in. Escapes come in the survive phase, before any of the
 * others; of the rest, the ones that improve your position come before the one that ends the roll
 * ("position before submission").
 */
const TYPE_LESSON_RANK: Record<TransitionType, number> = {
  escape: 0,
  sweep: 1,
  pass: 2,
  transition: 3,
  takedown: 4,
  submission: 5,
};

/** An escape that ends where it began only stops one attack: the person is still stuck there afterwards. */
function staysPut(technique: Transition): boolean {
  return technique.toId === technique.fromId;
}

/** A position's escapes: the ways out of it first, then the defences that only stop an attack there. */
function escapesFrom(techniques: Transition[]): Transition[] {
  const escapes = techniques.filter((t) => isEscape(t.type));
  return [...escapes.filter((t) => !staysPut(t)), ...escapes.filter(staysPut)];
}

/** One from each list in turn, techniques leading, until both run out. */
function alternate(techniques: StudyItem[], concepts: StudyItem[]): StudyItem[] {
  const woven: StudyItem[] = [];
  for (let i = 0; i < Math.max(techniques.length, concepts.length); i += 1) {
    const technique = techniques[i];
    const concept = concepts[i];
    if (technique) woven.push(technique);
    if (concept) woven.push(concept);
  }
  return woven;
}

/**
 * Every card once, in the order a coach would teach a beginner: survive first, attack later.
 *
 * It opens with the first concept in the student's own order. Then the survive phase visits every position,
 * the pins first because that is where a beginner spends the first months: the position, its escapes (ways out before defences that leave you there) woven
 * with the concepts it lists that are still new (so a short session mixes doing with understanding), then
 * the situation card for each side that has an escape. A concept no position lists follows each lesson, and any still left close the phase.
 * The attack phase then visits the positions in their own order for the remaining techniques, submissions
 * last, and the remaining situations. Techniques whose starting position is gone come at the very end.
 */
export function lessonOrder(lib: Library): StudyItem[] {
  const cards: StudyItem[] = [];
  const taught = new Set<string>();
  const teach = (kind: CardKind, id: string): StudyItem[] => {
    const key = `${kind}:${id}`;
    if (taught.has(key)) return [];
    taught.add(key);
    return [{ kind, id }];
  };
  const conceptCards = (concepts: Concept[]) => concepts.flatMap((c) => teach('concept', c.id));
  const techniqueCards = (techniques: Transition[]) => techniques.flatMap((t) => teach('transition', t.id));
  const from = (position: Position) => lib.transitions.filter((t) => t.fromId === position.id);

  cards.push(...conceptCards(lib.concepts.slice(0, 1)));
  const listed = new Set(lib.positions.flatMap((p) => p.conceptIds));
  const unlisted = lib.concepts.slice(1).filter((c) => !listed.has(c.id));

  const pinsFirst = [
    ...lib.positions.filter((p) => isPin(p.category)),
    ...lib.positions.filter((p) => !isPin(p.category)),
  ];
  pinsFirst.forEach((position, lesson) => {
    cards.push(...teach('position', position.id));
    const itsConcepts = lib.concepts.filter((c) => position.conceptIds.includes(c.id));
    cards.push(...alternate(techniqueCards(escapesFrom(from(position))), conceptCards(itsConcepts)));
    const options = positionOptions(lib, position.id);
    for (const role of POSITION_ROLES) {
      if (options[role].some((t) => isEscape(t.type))) {
        cards.push(...teach('situation', situationId(position.id, role)));
      }
    }
    cards.push(...conceptCards(unlisted.slice(lesson, lesson + 1)));
  });
  cards.push(...conceptCards(unlisted));

  for (const position of lib.positions) {
    const attacks = from(position).sort((a, b) => TYPE_LESSON_RANK[a.type] - TYPE_LESSON_RANK[b.type]);
    cards.push(...techniqueCards(attacks));
    const options = positionOptions(lib, position.id);
    for (const role of POSITION_ROLES) {
      if (options[role].length > 0) cards.push(...teach('situation', situationId(position.id, role)));
    }
  }

  cards.push(...conceptCards(lib.concepts), ...techniqueCards(lib.transitions));
  return cards;
}

/** The techniques in the order their cards are taught: escapes from the pins first. */
export function lessonTechniques(lib: Library): Transition[] {
  return lessonOrder(lib).flatMap((item) => {
    const technique = item.kind === 'transition' ? lib.transitionById.get(item.id) : undefined;
    return technique ? [technique] : [];
  });
}
