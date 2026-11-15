import { assertNever } from '../assertNever';
import type { CoreEnv } from '../core';
import { type Concept, endsTheRoll, type ItemKind, POSITION_ROLES, type Position, type Transition } from '../models';
import { starterContent } from '../seed';
import { situationId } from '../situations';
import { cardId } from '../srs';
import { findMissingStarterConcepts, findMissingStarterTechniques, linkAddedConcepts } from '../starter';
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

  /** A class write-up outlives the techniques it mentions: the entry is kept, without the deleted ones. */
  async function unlinkFromTrainingLog(techniqueIds: string[]) {
    const mentioning = (await storage.trainingLog.all()).filter((entry) =>
      entry.techniqueIds.some((id) => techniqueIds.includes(id)),
    );
    await storage.trainingLog.putMany(
      mentioning.map((entry) => ({
        ...entry,
        techniqueIds: entry.techniqueIds.filter((id) => !techniqueIds.includes(id)),
      })),
    );
  }

  async function deletePosition(id: string) {
    const touching = (await storage.transitions.all()).filter((t) => t.fromId === id || t.toId === id);
    for (const transition of touching) {
      await storage.transitions.remove(transition.id);
      await storage.reviews.remove(cardId('transition', transition.id));
    }
    const touchingIds = touching.map((t) => t.id);
    await unlinkVideos('transition', touchingIds);
    await unlinkFromTrainingLog(touchingIds);
    for (const role of POSITION_ROLES) await storage.reviews.remove(cardId('situation', situationId(id, role)));
    await storage.positions.remove(id);
  }

  /** The starter techniques the Blue belt page offers. Call inside a transaction. */
  async function offeredStarterTechniques(starter: Transition[]): Promise<Transition[]> {
    return findMissingStarterTechniques(
      starter,
      await storage.transitions.all(),
      await storage.positions.all(),
      await storage.starterDismissals.all(),
    );
  }

  /** The starter concepts the Concepts page offers. Call inside a transaction. */
  async function offeredStarterConcepts(starter: Concept[]): Promise<Concept[]> {
    return findMissingStarterConcepts(starter, await storage.concepts.all(), await storage.starterDismissals.all());
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
    saveTransition: (id: string | null, input: TransitionInput) =>
      save(storage.transitions, id, endsTheRoll(input.type) ? { ...input, toId: '' } : input),

    /**
     * Add the starter techniques on offer (missing and not dismissed), leaving everything stored untouched.
     * A technique the library never had also gets its starter video bookmark; one the user deleted does
     * not, because deleting kept that bookmark, unlinked. Resolves to how many techniques were added.
     */
    addMissingStarterTechniques(): Promise<number> {
      const starter = starterContent(now());
      return storage.transaction(async () => {
        const missing = await offeredStarterTechniques(starter.transitions);
        const addedIds = new Set(missing.map((t) => t.id));
        const storedVideoIds = new Set((await storage.videos.all()).map((v) => v.id));
        const videos = starter.videos.filter(
          (v) => v.linkedKind === 'transition' && addedIds.has(v.linkedId) && !storedVideoIds.has(v.id),
        );
        await storage.transitions.putMany(missing);
        await storage.videos.putMany(videos);
        return missing.length;
      });
    },

    /**
     * Stop offering the starter techniques on offer now. One that goes missing later is still offered.
     * Resolves to how many were dismissed.
     */
    dismissMissingStarterTechniques(): Promise<number> {
      const timestamp = now();
      const starter = starterContent(timestamp).transitions;
      return storage.transaction(async () => {
        const offered = await offeredStarterTechniques(starter);
        await storage.starterDismissals.putMany(offered.map((t) => ({ id: t.id, dismissedAt: timestamp })));
        return offered.length;
      });
    },

    /**
     * Add the starter concepts on offer (missing and not dismissed), leaving everything stored untouched except
     * that each one is linked to the stored starter positions whose starter version lists it. A concept the
     * library never had also gets its starter video bookmark; one the user deleted does not, because deleting
     * kept that bookmark, unlinked. Resolves to how many concepts were added.
     */
    addMissingStarterConcepts(): Promise<number> {
      const timestamp = now();
      const starter = starterContent(timestamp);
      return storage.transaction(async () => {
        const missing = await offeredStarterConcepts(starter.concepts);
        const addedIds = new Set(missing.map((c) => c.id));
        const storedVideoIds = new Set((await storage.videos.all()).map((v) => v.id));
        const videos = starter.videos.filter(
          (v) => v.linkedKind === 'concept' && addedIds.has(v.linkedId) && !storedVideoIds.has(v.id),
        );
        const linked = linkAddedConcepts(addedIds, starter.positions, await storage.positions.all());
        await storage.concepts.putMany(missing);
        await storage.videos.putMany(videos);
        await storage.positions.putMany(linked.map((p) => ({ ...p, updatedAt: timestamp })));
        return missing.length;
      });
    },

    /**
     * Stop offering the starter concepts on offer now. One that goes missing later is still offered.
     * Resolves to how many were dismissed.
     */
    dismissMissingStarterConcepts(): Promise<number> {
      const timestamp = now();
      const starter = starterContent(timestamp).concepts;
      return storage.transaction(async () => {
        const offered = await offeredStarterConcepts(starter);
        await storage.starterDismissals.putMany(offered.map((c) => ({ id: c.id, dismissedAt: timestamp })));
        return offered.length;
      });
    },

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
            await unlinkFromTrainingLog([id]);
            break;
          case 'concept':
            await deleteConcept(id);
            break;
          default:
            return assertNever(kind);
        }
        await storage.reviews.remove(cardId(kind, id));
        await unlinkVideos(kind, [id]);
      });
    },
  };
}
