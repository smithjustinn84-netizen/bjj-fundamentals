/** All timestamps are epoch milliseconds so they round-trip through JSON unchanged. */

/**
 * Union types are derived from these lists so the allowed values exist at runtime too
 * (for validation and for building menus) and cannot drift from the types.
 */
export const POSITION_CATEGORIES = ['standing', 'guard', 'top', 'back', 'scramble'] as const;
export type PositionCategory = (typeof POSITION_CATEGORIES)[number];
/** What a new position starts as: most of what beginners add is a guard. */
export const DEFAULT_POSITION_CATEGORY: PositionCategory = 'guard';

export interface Position {
  id: string;
  name: string;
  category: PositionCategory;
  /** One-line plain-language summary. */
  summary: string;
  /** Short goals for the person on top / with the advantage. */
  topGoals: string[];
  /** Short goals for the person on the bottom / defending. */
  bottomGoals: string[];
  /** Ids of concepts that matter most here. */
  conceptIds: string[];
  /** Suggested learning order (lower = earlier). */
  order: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export const TRANSITION_TYPES = ['sweep', 'pass', 'escape', 'submission', 'takedown', 'transition'] as const;
export type TransitionType = (typeof TRANSITION_TYPES)[number];
export const DEFAULT_TRANSITION_TYPE: TransitionType = 'sweep';

/** A submission ends the roll: it has no destination position, so its `toId` is empty. */
export function endsTheRoll(type: TransitionType): boolean {
  return type === 'submission';
}

export interface Transition {
  id: string;
  name: string;
  type: TransitionType;
  fromId: string;
  /** Destination position id. Empty for a type that `endsTheRoll`. */
  toId: string;
  steps: string[];
  commonMistakes: string[];
  /**
   * Whether the technique is on the blue belt test list. Rows saved before this field existed do not
   * have it, so read it through `isOnBlueBeltTest`, which supplies the default.
   */
  blueBeltTest?: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Concept {
  id: string;
  name: string;
  summary: string;
  keyPoints: string[];
  /** A tiny solo or partner drill to practise the idea. */
  drill: string;
  order: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export const ITEM_KINDS = ['concept', 'position', 'transition'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** What a review session can draw from: every kind, or just one. */
export const DECKS = ['all', ...ITEM_KINDS] as const;
export type Deck = (typeof DECKS)[number];

export function isItemKind(value: unknown): value is ItemKind {
  // Widening to string[] is safe: `includes` only reads, and lets any string be tested for membership.
  return typeof value === 'string' && (ITEM_KINDS as readonly string[]).includes(value);
}

export interface VideoBookmark {
  id: string;
  title: string;
  youtubeId: string;
  startSeconds: number;
  /** What this video is about. Empty linkedId = unlinked. */
  linkedKind: ItemKind | '';
  linkedId: string;
  note: string;
  createdAt: number;
}

/** Spaced-repetition state for one study card. id = `${kind}:${itemId}`. */
export interface ReviewState {
  id: string;
  kind: ItemKind;
  itemId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  due: number;
  lastReviewed: number;
}

export const GRADES = ['again', 'hard', 'good', 'easy'] as const;
export type Grade = (typeof GRADES)[number];

export interface ReviewLogEntry {
  id?: number;
  cardId: string;
  grade: Grade;
  reviewedAt: number;
}

/** Study ranks shown as a belt, lowest first. A motivational label for progress, not a real grading. */
export const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'] as const;
export type BeltRank = (typeof BELT_RANKS)[number];

/** Which way the position map flows: across the screen on wide displays, down it on narrow ones. */
export const MAP_ORIENTATIONS = ['horizontal', 'vertical'] as const;
export type MapOrientation = (typeof MAP_ORIENTATIONS)[number];
