import { TRANSITION_LABELS } from './labels';
import type { Library } from './library';
import type { ItemKind } from './models';
import { techniqueDrill } from './techniqueDrill';

export interface SearchHit {
  kind: ItemKind;
  id: string;
  name: string;
  /** One line saying what the item is, to tell similar names apart. */
  detail: string;
}

/** How many results to show: enough to find the item, few enough to stay on one phone screen. */
export const SEARCH_RESULT_LIMIT = 12;

interface Candidate extends SearchHit {
  /** Everything about the item that a search can match besides its name. */
  body: string[];
}

function candidates(lib: Library): Candidate[] {
  return [
    ...lib.concepts.map((c) => ({
      kind: 'concept' as const,
      id: c.id,
      name: c.name,
      detail: c.summary,
      body: [c.summary, ...c.keyPoints, c.drill, c.notes],
    })),
    ...lib.positions.map((p) => ({
      kind: 'position' as const,
      id: p.id,
      name: p.name,
      detail: p.summary,
      body: [p.summary, ...p.topGoals, ...p.bottomGoals, p.notes],
    })),
    ...lib.transitions.map((t) => {
      const from = lib.positionById.get(t.fromId)?.name;
      const detail = from ? `${TRANSITION_LABELS[t.type]} from ${from}` : TRANSITION_LABELS[t.type];
      return {
        kind: 'transition' as const,
        id: t.id,
        name: t.name,
        detail,
        body: [detail, ...t.steps, ...t.commonMistakes, techniqueDrill(t), t.notes],
      };
    }),
  ];
}

/**
 * Items matching every word of the query, ignoring case. Items whose name holds all the words come first,
 * then those matched through their text; within each group the library's learning order is kept.
 */
export function searchLibrary(lib: Library, query: string, limit: number): SearchHit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const byName: SearchHit[] = [];
  const byText: SearchHit[] = [];
  for (const { body, ...hit } of candidates(lib)) {
    const name = hit.name.toLowerCase();
    if (words.every((word) => name.includes(word))) byName.push(hit);
    else {
      const text = `${name} ${body.join(' ').toLowerCase()}`;
      if (words.every((word) => text.includes(word))) byText.push(hit);
    }
  }
  return [...byName, ...byText].slice(0, Math.max(0, limit));
}
