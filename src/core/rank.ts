import { BELT_RANKS, type BeltRank } from './models';

/** Stripes earned on a belt before moving up to the next one. */
export const MAX_STRIPES = 4;
/** The black belt is reserved for having learned everything. */
const BLACK_BELT_PERCENT = 100;
/** The belts below black share the range under 100% equally. */
const PERCENT_PER_BELT = BLACK_BELT_PERCENT / (BELT_RANKS.length - 1);
/** Each belt is split into a plain belt plus one step per stripe. */
const PERCENT_PER_STRIPE = PERCENT_PER_BELT / (MAX_STRIPES + 1);

export interface BeltProgress {
  belt: BeltRank;
  /** 0 to MAX_STRIPES. */
  stripes: number;
  /** The belt after this one, or null at black. */
  nextBelt: BeltRank | null;
  /** Whole percentage points of learning still needed for `nextBelt`; 0 at black. */
  percentToNextBelt: number;
}

/**
 * Turns "percent of cards learned" into a study rank: a belt every 25 points, a stripe every 5,
 * and black only at 100%. Out-of-range input is clamped.
 */
export function beltRank(percentLearned: number): BeltProgress {
  const percent = Math.min(BLACK_BELT_PERCENT, Math.max(0, percentLearned));
  const beltIndex = Math.floor(percent / PERCENT_PER_BELT);
  const belt = BELT_RANKS[beltIndex] ?? 'white';
  const nextBelt = BELT_RANKS[beltIndex + 1] ?? null;
  if (nextBelt === null) return { belt, stripes: 0, nextBelt, percentToNextBelt: 0 };
  const intoBelt = percent - beltIndex * PERCENT_PER_BELT;
  return {
    belt,
    stripes: Math.floor(intoBelt / PERCENT_PER_STRIPE),
    nextBelt,
    percentToNextBelt: Math.ceil(PERCENT_PER_BELT - intoBelt),
  };
}
