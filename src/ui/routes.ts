import { assertNever } from '../core/assertNever';
import type { Deck, ItemKind, PositionRole } from '../core/models';
import { situationPositionId } from '../core/situations';
import type { StudyItem } from '../core/study';

/** Every path in the app is built here, so a route can be renamed in one place. */
export const ROUTES = {
  home: '/',
  concepts: '/learn',
  positions: '/positions',
  transitions: '/transitions',
  blueBelt: '/blue-belt',
  review: '/review',
  log: '/log',
  videos: '/videos',
  backup: '/backup',
  more: '/more',
  edit: '/edit',
} as const;

/** Route patterns for `App.tsx`, built from the same pieces as the paths below so the two cannot drift. */
export const ROUTE_PATTERNS = {
  concept: `${ROUTES.concepts}/:id`,
  position: `${ROUTES.positions}/:id`,
  transition: `${ROUTES.transitions}/:id`,
  edit: `${ROUTES.edit}/:kind/:id`,
} as const;

/** Query parameter on the new-technique page naming the position it should start from. */
export const FROM_POSITION_PARAM = 'from';

/** Query parameter on a position's page naming the side it should open on. */
export const SIDE_PARAM = 'side';

/** A position's page, opened on one side of it. */
export function positionSidePath(positionId: string, role: PositionRole): string {
  return `${itemPath('position', positionId)}?${SIDE_PARAM}=${role}`;
}

/** The pages behind the Learn tab, so the shell can keep it lit on all of them. */
export const LEARN_ROUTES = [ROUTES.concepts, ROUTES.positions, ROUTES.transitions, ROUTES.blueBelt] as const;

/** The pages reached from More, so the shell can keep that tab lit on all of them. */
export const MORE_ROUTES = [ROUTES.more, ROUTES.videos, ROUTES.backup, ROUTES.edit] as const;

/** Query parameter on the review page naming the deck to open with. */
export const DECK_PARAM = 'deck';

/** The review page, opened on one deck. */
export function reviewPath(deck: Deck): string {
  return `${ROUTES.review}?${DECK_PARAM}=${deck}`;
}

/** The detail page for one item. */
export function itemPath(kind: ItemKind, id: string): string {
  switch (kind) {
    case 'concept':
      return `${ROUTES.concepts}/${id}`;
    case 'position':
      return `${ROUTES.positions}/${id}`;
    case 'transition':
      return `${ROUTES.transitions}/${id}`;
    default:
      return assertNever(kind);
  }
}

/** The page that says the most about a study card: the item's own, or for a situation its position's. */
export function studyItemPath(item: StudyItem): string {
  switch (item.kind) {
    case 'concept':
    case 'position':
    case 'transition':
      return itemPath(item.kind, item.id);
    case 'situation':
      return itemPath('position', situationPositionId(item.id));
    default:
      return assertNever(item.kind);
  }
}

/** The list page an item of this kind appears on. */
export function listPath(kind: ItemKind): string {
  switch (kind) {
    case 'concept':
      return ROUTES.concepts;
    case 'position':
    case 'transition':
      return ROUTES.positions;
    default:
      return assertNever(kind);
  }
}

export function editPath(kind: ItemKind, id: string): string {
  return `${ROUTES.edit}/${kind}/${id}`;
}

export const NEW_ITEM_ID = 'new';

export function newItemPath(kind: ItemKind, fromPositionId?: string): string {
  const query = fromPositionId ? `?${FROM_POSITION_PARAM}=${encodeURIComponent(fromPositionId)}` : '';
  return `${editPath(kind, NEW_ITEM_ID)}${query}`;
}
