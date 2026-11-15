import { items } from '../../bindings';
import { assertNever } from '../../core/assertNever';
import { plural } from '../../core/labels';
import { connections, itemName, type Library } from '../../core/library';
import type { ItemKind } from '../../core/models';

/** What else goes when this item is deleted, so the confirmation can say so. */
function cascadeWarning(lib: Library, kind: ItemKind, id: string): string {
  switch (kind) {
    case 'position': {
      const { outgoing, incoming } = connections(lib, id);
      const count = outgoing.length + incoming.length;
      return count ? ` This also deletes ${plural(count, 'technique')} connected to it.` : '';
    }
    case 'concept':
    case 'transition':
      return '';
    default:
      return assertNever(kind);
  }
}

/** Asks before deleting an item, naming what goes with it. Resolves to whether it was deleted. */
export async function confirmDelete(lib: Library, kind: ItemKind, id: string): Promise<boolean> {
  const name = itemName(lib, kind, id);
  if (name === null || !confirm(`Delete "${name}"?${cascadeWarning(lib, kind, id)}`)) return false;
  await items.deleteItem(kind, id);
  return true;
}
