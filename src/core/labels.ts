import { assertNever } from './assertNever';
import type { BackupTable } from './backup';
import type { BeltRank, Grade, ItemKind, PositionCategory, PositionRole, TransitionType } from './models';

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

/** How to say which side of a position someone is on, after its name: "Mount, on top". */
const END_SIDE_LABELS: Record<PositionCategory, [string, string]> = {
  standing: ['attacking', 'defending'],
  guard: ['passing', 'playing guard'],
  top: ['on top', 'underneath'],
  back: ['on their back', 'defending your back'],
  scramble: ['on top', 'underneath'],
};

export function endSideLabel(category: PositionCategory, role: PositionRole): string {
  const [top, bottom] = END_SIDE_LABELS[category];
  switch (role) {
    case 'top':
      return top;
    case 'bottom':
      return bottom;
    default:
      return assertNever(role);
  }
}

/** What a role is called in one kind of position. */
export function roleLabel(category: PositionCategory, role: PositionRole): string {
  const [top, bottom] = ROLE_LABELS[category];
  switch (role) {
    case 'top':
      return top;
    case 'bottom':
      return bottom;
    default:
      return assertNever(role);
  }
}

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  sweep: 'Sweep',
  pass: 'Guard pass',
  escape: 'Escape',
  submission: 'Submission',
  takedown: 'Takedown',
  transition: 'Transition',
};

/** Headings for a list of techniques grouped by type. */
export const TRANSITION_GROUP_LABELS: Record<TransitionType, string> = {
  sweep: 'Sweeps',
  pass: 'Guard passes',
  escape: 'Escapes',
  submission: 'Submissions',
  takedown: 'Takedowns',
  transition: 'Transitions',
};

export const KIND_LABELS: Record<ItemKind, string> = {
  concept: 'Concept',
  position: 'Position',
  transition: 'Technique',
};

/** Headings for a list of items of one kind. */
export const KIND_GROUP_LABELS: Record<ItemKind, string> = {
  concept: 'Concepts',
  position: 'Positions',
  transition: 'Techniques',
};

export const GRADE_LABELS: Record<Grade, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

/** Shared by the technique form's checkbox and the blue belt page that tells people to tick it. */
export const BLUE_BELT_TEST_LABEL = 'On the blue belt test';

export const TABLE_LABELS: Record<BackupTable, string> = {
  concepts: 'Concepts',
  positions: 'Positions',
  transitions: 'Techniques',
  videos: 'Video bookmarks',
  reviews: 'Cards studied',
  reviewLog: 'Review history',
  starterDismissals: 'Dismissed starter techniques',
  trainingLog: 'Training log entries',
};

export const BELT_LABELS: Record<BeltRank, string> = {
  white: 'White belt',
  blue: 'Blue belt',
  purple: 'Purple belt',
  brown: 'Brown belt',
  black: 'Black belt',
};

/** "1 card", "2 cards". Only for nouns that take a plain "s". */
export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
