import { assertNever } from './assertNever';
import { isOnBlueBeltTest } from './beltTest';
import { lessonOrder, type StudyItem } from './curriculum';
import { type Lesson, lessonCards } from './lessons';
import { itemName, type Library, reviewOf } from './library';
import type { Concept, Deck } from './models';
import { findSituation, situationName } from './situations';
import { cardId, isLearned } from './srs';

export type { StudyItem };

/**
 * The cards of a deck, in the order new ones are taught. The concept and position decks follow their own
 * numbered lists, as their pages do; every other deck follows the lessons (see `lessonOrder`).
 */
function deckItems(lib: Library, deck: Deck): StudyItem[] {
  switch (deck) {
    case 'concept':
      return lib.concepts.map((c) => ({ kind: 'concept', id: c.id }));
    case 'position':
      return lib.positions.map((p) => ({ kind: 'position', id: p.id }));
    case 'all':
    case 'transition':
    case 'situation':
    case 'blueBelt':
      return lessonOrder(lib).filter((item) => isInDeck(lib, deck, item));
    default:
      return assertNever(deck);
  }
}

/** What a card is called in a list, or null if what it was about no longer exists. */
export function cardName(lib: Library, item: StudyItem): string | null {
  switch (item.kind) {
    case 'concept':
    case 'position':
    case 'transition':
      return itemName(lib, item.kind, item.id);
    case 'situation': {
      const situation = findSituation(lib, item.id);
      return situation ? situationName(situation) : null;
    }
    default:
      return assertNever(item.kind);
  }
}

export interface StudyQueue {
  /** Cards already studied whose due time has passed, most overdue first. */
  due: StudyItem[];
  /** Cards never studied: the ones the training log puts first, then the rest in lesson order. */
  fresh: StudyItem[];
  /** What a session will show: all due cards, then up to `newLimit` fresh ones. */
  queue: StudyItem[];
  /** How many of the queue's fresh cards the training log put first. */
  fromClass: number;
}

function isInDeck(lib: Library, deck: Deck, item: StudyItem): boolean {
  switch (deck) {
    case 'all':
      return true;
    case 'concept':
    case 'position':
    case 'transition':
    case 'situation':
      return item.kind === deck;
    case 'blueBelt': {
      const technique = item.kind === 'transition' ? lib.transitionById.get(item.id) : undefined;
      return !!technique && isOnBlueBeltTest(technique);
    }
    default:
      return assertNever(deck);
  }
}

/**
 * `firstCardIds` are the cards the training log says to study first, in order (see `studyFirst`). Their fresh
 * cards jump the queue of new cards: what happened on the mat this week is learned while it is fresh.
 */
function queueOf(
  lib: Library,
  items: StudyItem[],
  newLimit: number,
  now: number,
  firstCardIds: readonly string[],
): StudyQueue {
  const due: { item: StudyItem; dueAt: number }[] = [];
  const fresh: StudyItem[] = [];
  for (const item of items) {
    const state = reviewOf(lib, item.kind, item.id);
    if (!state) fresh.push(item);
    else if (state.due <= now) due.push({ item, dueAt: state.due });
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  const dueItems = due.map((d) => d.item);
  const place = (item: StudyItem) => firstCardIds.indexOf(cardId(item.kind, item.id));
  const wasPractised = (item: StudyItem) => place(item) >= 0;
  const fromClass = fresh.filter(wasPractised).sort((a, b) => place(a) - place(b));
  const ordered = [...fromClass, ...fresh.filter((item) => !wasPractised(item))];
  const newCards = ordered.slice(0, Math.max(0, newLimit));
  return {
    due: dueItems,
    fresh: ordered,
    queue: [...dueItems, ...newCards],
    fromClass: newCards.filter(wasPractised).length,
  };
}

/** A session on one deck. */
export function buildQueue(
  lib: Library,
  deck: Deck,
  newLimit: number,
  now: number,
  firstCardIds: readonly string[] = [],
): StudyQueue {
  return queueOf(lib, deckItems(lib, deck), newLimit, now, firstCardIds);
}

/** A session on one lesson's cards only, new ones in the lesson's own order. */
export function buildLessonQueue(lib: Library, lesson: Lesson, newLimit: number, now: number): StudyQueue {
  return queueOf(lib, lessonCards(lib, lesson), newLimit, now, []);
}

export interface ProgressSummary {
  total: number;
  started: number;
  learned: number;
  /** Whole-number percentage of cards learned. */
  percentLearned: number;
}

export function progressSummary(lib: Library): ProgressSummary {
  const ids = lessonOrder(lib).map((i) => cardId(i.kind, i.id));
  const learned = ids.filter((id) => isLearned(lib.reviews.get(id))).length;
  const started = ids.filter((id) => lib.reviews.has(id)).length;
  return {
    total: ids.length,
    started,
    learned,
    percentLearned: ids.length ? Math.round((learned / ids.length) * 100) : 0,
  };
}

/** How many new cards a session brings in unless the student moves the slider. */
export const DEFAULT_NEW_CARDS = 5;

/** How many sticking points to show at once: enough to work on before the next class, few enough to read at a glance. */
export const STICKING_POINT_LIMIT = 5;

/** One miss is normal on a new card; a card is a sticking point once it has been forgotten this many times. */
const STICKING_POINT_MIN_LAPSES = 2;

/**
 * Cards that keep slipping: forgotten more than once and not learned at the moment. Most often forgotten
 * first, then the ones the scheduler finds hardest (lowest ease), then lesson order.
 */
export function stickingPoints(lib: Library, limit: number): StudyItem[] {
  const slipping: { item: StudyItem; lapses: number; ease: number }[] = [];
  for (const item of lessonOrder(lib)) {
    const state = reviewOf(lib, item.kind, item.id);
    if (state && state.lapses >= STICKING_POINT_MIN_LAPSES && !isLearned(state))
      slipping.push({ item, lapses: state.lapses, ease: state.ease });
  }
  slipping.sort((a, b) => b.lapses - a.lapses || a.ease - b.ease);
  return slipping.slice(0, Math.max(0, limit)).map((s) => s.item);
}

/** The concepts not learned yet, in learning order, up to `limit`: what to read next. */
export function conceptsToLearn(lib: Library, limit: number): Concept[] {
  return lib.concepts.filter((c) => !isLearned(reviewOf(lib, 'concept', c.id))).slice(0, Math.max(0, limit));
}
