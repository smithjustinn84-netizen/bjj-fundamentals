import { assertNever } from '../core/assertNever';
import type { ItemKind } from '../core/models';

/** Every path in the app is built here, so a route can be renamed in one place. */
export const ROUTES = {
  home: '/',
  concepts: '/learn',
  positions: '/positions',
  transitions: '/transitions',
  blueBelt: '/blue-belt',
  review: '/review',
  videos: '/videos',
  backup: '/backup',
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
