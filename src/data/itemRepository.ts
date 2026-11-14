import { assertNever } from '../domain/assertNever';
import { cardId } from '../domain/srs';
import type { Concept, ItemKind, Position, Transition } from '../domain/types';
import type { BjjDB } from './db';

/** Fields the repository fills in, so callers cannot get ids or timestamps wrong. */
type Managed = 'id' | 'createdAt' | 'updatedAt';
export type ConceptInput = Omit<Concept, Managed>;
export type PositionInput = Omit<Position, Managed>;
export type TransitionInput = Omit<Transition, Managed>;

/** Reads and writes for the three kinds of study item: concepts, positions and transitions. */
export function createItemRepository(db: BjjDB) {
  /** The fields the repository owns. A null id means "create"; otherwise the original creation time is kept. */
  async function managedFields(
    id: string | null,
    find: (id: string) => Promise<{ createdAt: number } | undefined>,
    now: number,
  ) {
    const existing = id ? await find(id) : undefined;
    return { id: id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now };
  }

  async function unlinkVideos(kind: ItemKind, ids: string[]) {
    await db.videos
      .where('[linkedKind+linkedId]')
      .anyOf(ids.map((id) => [kind, id]))
      .modify({ linkedKind: '', linkedId: '' });
  }

  return {
    /** Each save creates the item when `id` is null, otherwise replaces it. Resolves to the item's id. */
    async saveConcept(id: string | null, input: ConceptInput, now = Date.now()): Promise<string> {
      const managed = await managedFields(id, (key) => db.concepts.get(key), now);
      await db.concepts.put({ ...input, ...managed });
      return managed.id;
    },
    async savePosition(id: string | null, input: PositionInput, now = Date.now()): Promise<string> {
      const managed = await managedFields(id, (key) => db.positions.get(key), now);
      await db.positions.put({ ...input, ...managed });
      return managed.id;
    },
    async saveTransition(id: string | null, input: TransitionInput, now = Date.now()): Promise<string> {
      const managed = await managedFields(id, (key) => db.transitions.get(key), now);
      await db.transitions.put({ ...input, ...managed });
      return managed.id;
    },

    /**
     * Delete an item and everything that only makes sense alongside it: its review card,
     * transitions touching a deleted position, and references from positions to a deleted concept.
     * Video bookmarks are kept but unlinked.
     */
    async deleteItem(kind: ItemKind, id: string): Promise<void> {
      await db.transaction('rw', [db.positions, db.transitions, db.concepts, db.videos, db.reviews], async () => {
        switch (kind) {
          case 'position': {
            const linked = await db.transitions.where('fromId').equals(id).or('toId').equals(id).primaryKeys();
            await db.transitions.bulkDelete(linked);
            await db.reviews.bulkDelete(linked.map((t) => cardId('transition', t)));
            await unlinkVideos('transition', linked);
            await db.positions.delete(id);
            break;
          }
          case 'transition':
            await db.transitions.delete(id);
            break;
          case 'concept':
            await db.concepts.delete(id);
            await db.positions.toCollection().modify((p) => {
              p.conceptIds = p.conceptIds.filter((c) => c !== id);
            });
            break;
          default:
            assertNever(kind);
        }
        await db.reviews.delete(cardId(kind, id));
        await unlinkVideos(kind, [id]);
      });
    },
  };
}
