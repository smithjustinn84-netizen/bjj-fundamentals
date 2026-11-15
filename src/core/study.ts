import { assertNever } from './assertNever';
import { isOnBlueBeltTest } from './beltTest';
import { type Library, reviewOf } from './library';
import type { Deck, ItemKind } from './models';
import { cardId, isLearned } from './srs';

/** One thing that can be studied as a flashcard. */
export interface StudyItem {
  kind: ItemKind;
  id: string;
}

/** Every card, in learning order: concepts, then positions, then the techniques that connect them. */
function allStudyItems(lib: Library): StudyItem[] {
  return [
    ...lib.concepts.map((c) => ({ kind: 'concept' as const, id: c.id })),
    ...lib.positions.map((p) => ({ kind: 'position' as const, id: p.id })),
    ...lib.transitions.map((t) => ({ kind: 'transition' as const, id: t.id })),
  ];
}

export interface StudyQueue {
  /** Cards already studied whose due time has passed, most overdue first. */
  due: StudyItem[];
  /** Cards never studied: techniques from recent classes first, then the rest in learning order. */
  fresh: StudyItem[];
  /** What a session will show: all due cards, then up to `newLimit` fresh ones. */
  queue: StudyItem[];
  /** How many of the queue's fresh cards are techniques practised in a recent class. */
  fromClass: number;
}

function isInDeck(lib: Library, deck: Deck, item: StudyItem): boolean {
  switch (deck) {
    case 'all':
      return true;
    case 'concept':
    case 'position':
    case 'transition':
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
 * `practisedIds` are techniques from recent classes, most recent first (see `recentlyPractised`). Their
 * fresh cards jump the queue of new cards: what was drilled on the mat this week is learned while it is fresh.
 */
export function buildQueue(
  lib: Library,
  deck: Deck,
  newLimit: number,
  now: number,
  practisedIds: readonly string[] = [],
): StudyQueue {
  const items = allStudyItems(lib).filter((item) => isInDeck(lib, deck, item));
  const due: { item: StudyItem; dueAt: number }[] = [];
  const fresh: StudyItem[] = [];
  for (const item of items) {
    const state = reviewOf(lib, item.kind, item.id);
    if (!state) fresh.push(item);
    else if (state.due <= now) due.push({ item, dueAt: state.due });
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  const dueItems = due.map((d) => d.item);
  const wasPractised = (item: StudyItem) => item.kind === 'transition' && practisedIds.includes(item.id);
  const fromClass = fresh.filter(wasPractised).sort((a, b) => practisedIds.indexOf(a.id) - practisedIds.indexOf(b.id));
  const ordered = [...fromClass, ...fresh.filter((item) => !wasPractised(item))];
  const newCards = ordered.slice(0, Math.max(0, newLimit));
  return {
    due: dueItems,
    fresh: ordered,
    queue: [...dueItems, ...newCards],
    fromClass: newCards.filter(wasPractised).length,
  };
}

export interface ProgressSummary {
  total: number;
  started: number;
  learned: number;
  /** Whole-number percentage of cards learned. */
  percentLearned: number;
}

export function progressSummary(lib: Library): ProgressSummary {
  const ids = allStudyItems(lib).map((i) => cardId(i.kind, i.id));
  const learned = ids.filter((id) => isLearned(lib.reviews.get(id))).length;
  const started = ids.filter((id) => lib.reviews.has(id)).length;
  return {
    total: ids.length,
    started,
    learned,
    percentLearned: ids.length ? Math.round((learned / ids.length) * 100) : 0,
  };
}

/** How many sticking points to show at once: enough to work on before the next class, few enough to read at a glance. */
export const STICKING_POINT_LIMIT = 5;

/**
 * Cards that keep slipping: forgotten at least once and not learned at the moment. Most often forgotten
 * first, then the ones the scheduler finds hardest (lowest ease), then learning order.
 */
export function stickingPoints(lib: Library, limit: number): StudyItem[] {
  const slipping: { item: StudyItem; lapses: number; ease: number }[] = [];
  for (const item of allStudyItems(lib)) {
    const state = reviewOf(lib, item.kind, item.id);
    if (state && state.lapses > 0 && !isLearned(state)) slipping.push({ item, lapses: state.lapses, ease: state.ease });
  }
  slipping.sort((a, b) => b.lapses - a.lapses || a.ease - b.ease);
  return slipping.slice(0, Math.max(0, limit)).map((s) => s.item);
}
