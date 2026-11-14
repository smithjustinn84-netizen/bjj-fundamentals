import type { Library } from './library';
import { cardId, isLearned } from './srs';
import type { ItemKind } from './types';

/** One thing that can be studied as a flashcard. */
export interface StudyItem {
  kind: ItemKind;
  id: string;
}

export type Deck = 'all' | ItemKind;

/** Every card, in learning order: concepts, then positions, then the techniques that connect them. */
export function allStudyItems(lib: Library): StudyItem[] {
  return [
    ...lib.concepts.map((c) => ({ kind: 'concept' as const, id: c.id })),
    ...lib.positions.map((p) => ({ kind: 'position' as const, id: p.id })),
    ...lib.transitions.map((t) => ({ kind: 'transition' as const, id: t.id })),
  ];
}

export interface StudyQueue {
  /** Cards already studied whose due time has passed, most overdue first. */
  due: StudyItem[];
  /** Cards never studied, in learning order. */
  fresh: StudyItem[];
  /** What a session will show: all due cards, then up to `newLimit` fresh ones. */
  queue: StudyItem[];
}

export function buildQueue(lib: Library, deck: Deck, newLimit: number, now: number): StudyQueue {
  const items = allStudyItems(lib).filter((i) => deck === 'all' || i.kind === deck);
  const due: { item: StudyItem; dueAt: number }[] = [];
  const fresh: StudyItem[] = [];
  for (const item of items) {
    const state = lib.reviews.get(cardId(item.kind, item.id));
    if (!state) fresh.push(item);
    else if (state.due <= now) due.push({ item, dueAt: state.due });
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  const dueItems = due.map((d) => d.item);
  return { due: dueItems, fresh, queue: [...dueItems, ...fresh.slice(0, Math.max(0, newLimit))] };
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
