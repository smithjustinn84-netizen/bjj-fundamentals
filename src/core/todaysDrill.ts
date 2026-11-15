import { lessonTechniques } from './curriculum';
import { type Library, reviewOf } from './library';
import type { TrainingEntry, Transition } from './models';
import { findSituation } from './situations';
import { isLearned } from './srs';
import { stickingPoints } from './study';
import { techniqueDrill } from './techniqueDrill';
import { RECENT_CLASS_COUNT, recentlyPractised, recentlyStuck } from './trainingLog';

/** Why a drill was picked, most pressing first. */
const DRILL_REASONS = ['stuck', 'slipping', 'practised', 'next'] as const;
export type DrillReason = (typeof DRILL_REASONS)[number];

export interface DrillPick {
  technique: Transition;
  drill: string;
  reason: DrillReason;
}

/**
 * One drill worth doing today, or null if no technique that needs work has one. It answers the most pressing
 * need first: a way out of where the student last got stuck, then a technique that keeps slipping in review,
 * then one practised in a recent class, then the next technique not yet learned, in lesson order. Learned techniques and
 * techniques without a drill are passed over.
 */
export function pickDrill(lib: Library, entries: TrainingEntry[]): DrillPick | null {
  const needsWork = (technique: Transition | undefined): technique is Transition =>
    !!technique && techniqueDrill(technique) !== '' && !isLearned(reviewOf(lib, 'transition', technique.id));
  const byId = (id: string) => lib.transitionById.get(id);

  const candidates: [DrillReason, (Transition | undefined)[]][] = [
    ['stuck', recentlyStuck(entries, RECENT_CLASS_COUNT).flatMap((id) => findSituation(lib, id)?.options ?? [])],
    [
      'slipping',
      // Every sticking point, not Home's short list: that one can be full of cards that are not techniques.
      stickingPoints(lib, lib.reviews.size)
        .filter((item) => item.kind === 'transition')
        .map((item) => byId(item.id)),
    ],
    ['practised', recentlyPractised(entries, RECENT_CLASS_COUNT).map(byId)],
    ['next', lessonTechniques(lib)],
  ];
  for (const [reason, techniques] of candidates) {
    const technique = techniques.find(needsWork);
    if (technique) return { technique, drill: techniqueDrill(technique), reason };
  }
  return null;
}

export interface PositionProgress {
  /** Techniques that start at the position. */
  total: number;
  /** How many of them have a learned study card. */
  learned: number;
}

export function positionProgress(lib: Library, positionId: string): PositionProgress {
  const techniques = lib.transitions.filter((technique) => technique.fromId === positionId);
  return {
    total: techniques.length,
    learned: techniques.filter((technique) => isLearned(reviewOf(lib, 'transition', technique.id))).length,
  };
}
