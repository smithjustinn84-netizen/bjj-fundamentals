import { assertNever } from '../assertNever';
import type { CoreEnv } from '../core';
import type { Concept, ItemKind, Position, Transition } from '../models';
import { cardId } from '../srs';
import type { Repository } from '../storage';

/** Fields the service fills in, so callers cannot get ids or timestamps wrong. */
type Managed = 'id' | 'createdAt' | 'updatedAt';
export type ConceptInput = Omit<Concept, Managed>;
export type PositionInput = Omit<Position, Managed>;
export type TransitionInput = Omit<Transition, Managed>;

/** Creating, editing and deleting the three kinds of study item. */
export function createItemService({ storage, newId, now }: CoreEnv) {
  /** Create the item when `id` is null, otherwise replace it keeping its creation time. Resolves to its id. */
  async function save<T extends { id: string; createdAt: number; updatedAt: number }>(
    repository: Repository<T>,
    id: string | null,
    input: Omit<T, Managed>,
  ): Promise<string> {
    const timestamp = now();
    const existing = id ? await repository.get(id) : undefined;
    const managed = { id: id ?? newId(), createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp };
    // Safe: T is exactly its input fields plus the three managed fields supplied here.
    await repository.put({ ...input, ...managed } as T);
    return managed.id;
  }

  /** Bookmarks outlive the item they were about: they are kept, with the link cleared. */
  async function unlinkVideos(kind: ItemKind, ids: string[]) {
    const linked = (await storage.videos.all()).filter((v) => v.linkedKind === kind && ids.includes(v.linkedId));
    await storage.videos.putMany(linked.map((v) => ({ ...v, linkedKind: '' as const, linkedId: '' })));
  }

  async function deletePosition(id: string) {
    const touching = (await storage.transitions.all()).filter((t) => t.fromId === id || t.toId === id);
    for (const transition of touching) {
      await storage.transitions.remove(transition.id);
      await storage.reviews.remove(cardId('transition', transition.id));
    }
    await unlinkVideos(
      'transition',
      touching.map((t) => t.id),
    );
    await storage.positions.remove(id);
  }

  async function deleteConcept(id: string) {
    await storage.concepts.remove(id);
    const referencing = (await storage.positions.all()).filter((p) => p.conceptIds.includes(id));
    await storage.positions.putMany(
      referencing.map((p) => ({ ...p, conceptIds: p.conceptIds.filter((conceptId) => conceptId !== id) })),
    );
  }

  return {
    saveConcept: (id: string | null, input: ConceptInput) => save(storage.concepts, id, input),
    savePosition: (id: string | null, input: PositionInput) => save(storage.positions, id, input),
    saveTransition: (id: string | null, input: TransitionInput) => save(storage.transitions, id, input),

    /**
     * Delete an item and everything that only makes sense alongside it: its review card,
     * transitions touching a deleted position, and references from positions to a deleted concept.
     */
    deleteItem(kind: ItemKind, id: string): Promise<void> {
      return storage.transaction(async () => {
        switch (kind) {
          case 'position':
            await deletePosition(id);
            break;
          case 'transition':
            await storage.transitions.remove(id);
            break;
          case 'concept':
            await deleteConcept(id);
            break;
          default:
            assertNever(kind);
        }
        await storage.reviews.remove(cardId(kind, id));
        await unlinkVideos(kind, [id]);
      });
    },
  };
}
