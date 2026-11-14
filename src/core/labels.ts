import type { BackupTable } from './backup';
import type { BeltRank, ItemKind, PositionCategory, TransitionType } from './models';

export const CATEGORY_LABELS: Record<PositionCategory, string> = {
  standing: 'Standing',
  guard: 'Guards',
  top: 'Top positions',
  back: 'Back',
  scramble: 'Scrambles',
};

/** Who "top" and "bottom" mean differs by position; these labels keep it readable. */
export const ROLE_LABELS: Record<PositionCategory, [string, string]> = {
  standing: ['Attacking', 'Defending'],
  guard: ['Top (passing)', 'Bottom (guard player)'],
  top: ['Top', 'Bottom'],
  back: ['Taking the back', 'Defending'],
  scramble: ['Attacking', 'Defending'],
};

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  sweep: 'Sweep',
  pass: 'Guard pass',
  escape: 'Escape',
  submission: 'Submission',
  takedown: 'Takedown',
  transition: 'Transition',
};

export const KIND_LABELS: Record<ItemKind, string> = {
  concept: 'Concept',
  position: 'Position',
  transition: 'Technique',
};

export const TABLE_LABELS: Record<BackupTable, string> = {
  concepts: 'Concepts',
  positions: 'Positions',
  transitions: 'Techniques',
  videos: 'Video bookmarks',
  reviews: 'Cards studied',
  reviewLog: 'Review history',
};

export const BELT_LABELS: Record<BeltRank, string> = {
  white: 'White belt',
  blue: 'Blue belt',
  purple: 'Purple belt',
  brown: 'Brown belt',
  black: 'Black belt',
};
