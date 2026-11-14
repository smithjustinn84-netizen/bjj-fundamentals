import { assertNever } from '../domain/assertNever';
import type { ItemKind } from '../domain/types';

/** Every path in the app is built here, so a route can be renamed in one place. */
export const ROUTES = {
  home: '/',
  concepts: '/learn',
  positions: '/positions',
  review: '/review',
  videos: '/videos',
  backup: '/backup',
} as const;

/** The detail page for one item. */
export function itemPath(kind: ItemKind, id: string): string {
  switch (kind) {
    case 'concept':
      return `${ROUTES.concepts}/${id}`;
    case 'position':
      return `${ROUTES.positions}/${id}`;
    case 'transition':
      return `/transitions/${id}`;
    default:
      return assertNever(kind);
  }
}

/** The list page an item of this kind appears on. */
export function listPath(kind: ItemKind): string {
  return kind === 'concept' ? ROUTES.concepts : ROUTES.positions;
}

export function editPath(kind: ItemKind, id: string): string {
  return `/edit/${kind}/${id}`;
}

export const NEW_ITEM_ID = 'new';

export function newItemPath(kind: ItemKind, fromPositionId?: string): string {
  const query = fromPositionId ? `?from=${encodeURIComponent(fromPositionId)}` : '';
  return `${editPath(kind, NEW_ITEM_ID)}${query}`;
}
