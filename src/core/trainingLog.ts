import type { Library } from './library';
import type { TrainingEntry } from './models';
import { findSituation } from './situations';
import { cardId } from './srs';

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS_PER_YEAR = 12;
/** The longest a month gets. A day key is a label for sorting and display, so 31 is allowed in every month. */
const MAX_DAY_OF_MONTH = 31;
const MINUTES_PER_HOUR = 60;

/** Whether a string is a calendar day written `YYYY-MM-DD`, the form `localDayKey` and a date input both produce. */
export function isDayKey(value: string): boolean {
  const match = DAY_KEY.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= MONTHS_PER_YEAR && day >= 1 && day <= MAX_DAY_OF_MONTH;
}

/** Most recent class first; two classes on one day keep the later write-up on top. */
export function newestFirst(entries: TrainingEntry[]): TrainingEntry[] {
  return [...entries].sort((a, b) => b.day.localeCompare(a.day) || b.createdAt - a.createdAt);
}

/** The situations an entry says the student got stuck in. Entries stored before the field existed have none. */
export function stuckSituationIds(entry: TrainingEntry): string[] {
  return entry.stuckIds ?? [];
}

export interface TrainingSummary {
  classes: number;
  minutes: number;
  /** The focus set after the most recent class that set one, or '' if none has. */
  focus: string;
}

export function trainingSummary(entries: TrainingEntry[]): TrainingSummary {
  return {
    classes: entries.length,
    minutes: entries.reduce((total, entry) => total + entry.minutes, 0),
    focus: newestFirst(entries).find((entry) => entry.focus !== '')?.focus ?? '',
  };
}

/** Mat time for display: "45 min", "2 h", "1 h 30 min". */
export function formatMatTime(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** "1 class", "3 classes". `plural` in labels only handles nouns that take a plain "s". */
export function formatClassCount(count: number): string {
  return `${count} ${count === 1 ? 'class' : 'classes'}`;
}

/** How many of the latest classes count as recent when deciding what to study first. */
export const RECENT_CLASS_COUNT = 3;

/** Ids of the techniques practised in the latest classes, most recent class first, each id once. */
export function recentlyPractised(entries: TrainingEntry[], classCount: number): string[] {
  const recent = newestFirst(entries).slice(0, Math.max(0, classCount));
  return [...new Set(recent.flatMap((entry) => entry.techniqueIds))];
}

/**
 * Where the student got stuck in the most recent of the latest classes that named anywhere, as situation ids.
 * An older class is left out: its sticking points no longer come first in review.
 */
export function recentlyStuck(entries: TrainingEntry[], classCount: number): string[] {
  const recent = newestFirst(entries).slice(0, Math.max(0, classCount));
  return recent.map(stuckSituationIds).find((ids) => ids.length > 0) ?? [];
}

/**
 * The cards to study before any other new card, as card ids, from the latest classes. Where the student got
 * stuck comes first: that situation's card, then each technique they have from there. Then come the
 * techniques they practised. Each id appears once.
 */
export function studyFirst(lib: Library, entries: TrainingEntry[], classCount: number): string[] {
  const recent = newestFirst(entries).slice(0, Math.max(0, classCount));
  const stuck = recent.flatMap(stuckSituationIds).flatMap((id) => {
    const situation = findSituation(lib, id);
    if (!situation) return [];
    return [cardId('situation', id), ...situation.options.map((technique) => cardId('transition', technique.id))];
  });
  const practised = recentlyPractised(entries, classCount).map((id) => cardId('transition', id));
  return [...new Set([...stuck, ...practised])];
}
