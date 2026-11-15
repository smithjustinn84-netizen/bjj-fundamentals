import { describe, expect, it, vi } from 'vitest';
import type { BackupData } from '../backup';
import type { AppStorage, StorageOptions } from '../storage';
import { concept, position } from './testFixtures';

/**
 * The behaviour every AppStorage implementation must have. To add a storage engine, write a test file
 * that calls `describeStorageContract` with a factory for it; when this suite passes, the app will run on it.
 */

export interface StorageUnderTest {
  /** Open a storage on a database that does not exist yet. */
  create(options: StorageOptions): AppStorage | Promise<AppStorage>;
  /**
   * Open the database that the most recent `create` call made, as an app restart would.
   * Leave out for engines that do not persist anything.
   */
  reopen?(options: StorageOptions): AppStorage | Promise<AppStorage>;
}

const initialData: BackupData = {
  concepts: [concept({ id: 'c1', name: 'One' }), concept({ id: 'c2', name: 'Two' })],
  positions: [position({ id: 'p1' })],
  transitions: [],
  videos: [],
  reviews: [],
  reviewLog: [],
  starterDismissals: [],
};

const logEntry = (reviewedAt: number) => ({ cardId: 'concept:c1', grade: 'good' as const, reviewedAt });

export function describeStorageContract(name: string, { create, reopen }: StorageUnderTest) {
  describe(`${name}: storage contract`, () => {
    it('starts with the initial data', async () => {
      const storage = await create({ initialData });
      expect((await storage.concepts.all()).map((c) => c.id).sort()).toEqual(['c1', 'c2']);
      expect(await storage.positions.count()).toBe(1);
      expect(await storage.videos.all()).toEqual([]);
    });

    it('gets, inserts, replaces and removes rows by id', async () => {
      const storage = await create({ initialData });
      expect(await storage.concepts.get('c1')).toMatchObject({ name: 'One' });
      expect(await storage.concepts.get('missing')).toBeUndefined();

      await storage.concepts.put(concept({ id: 'c3', name: 'Three' }));
      await storage.concepts.put(concept({ id: 'c1', name: 'One, edited' }));
      expect(await storage.concepts.count()).toBe(3);
      expect(await storage.concepts.get('c1')).toMatchObject({ name: 'One, edited' });

      await storage.concepts.remove('c1');
      await storage.concepts.remove('never-existed');
      expect((await storage.concepts.all()).map((c) => c.id).sort()).toEqual(['c2', 'c3']);
    });

    it('has an empty starter dismissals table that reads and writes by id', async () => {
      const storage = await create({ initialData });
      expect(await storage.starterDismissals.count()).toBe(0);
      await storage.starterDismissals.put({ id: 'sweep', dismissedAt: 5 });
      expect(await storage.starterDismissals.all()).toEqual([{ id: 'sweep', dismissedAt: 5 }]);
    });

    it('stores nested lists intact', async () => {
      const storage = await create({ initialData });
      await storage.concepts.put(concept({ id: 'c9', keyPoints: ['a', 'b'] }));
      expect((await storage.concepts.get('c9'))?.keyPoints).toEqual(['a', 'b']);
    });

    it('putMany inserts and replaces; clear empties one table only', async () => {
      const storage = await create({ initialData });
      await storage.concepts.putMany([concept({ id: 'c2', name: 'Two, edited' }), concept({ id: 'c4' })]);
      expect(await storage.concepts.count()).toBe(3);
      expect(await storage.concepts.get('c2')).toMatchObject({ name: 'Two, edited' });

      await storage.concepts.clear();
      expect(await storage.concepts.count()).toBe(0);
      expect(await storage.positions.count()).toBe(1);
    });

    it('review log assigns increasing ids, reads strictly after a timestamp, and keeps restored ids', async () => {
      const storage = await create({ initialData });
      await storage.reviewLog.add(logEntry(100));
      await storage.reviewLog.add(logEntry(200));
      const [first, second] = await storage.reviewLog.all();
      expect(typeof first?.id).toBe('number');
      expect(second?.id).toBeGreaterThan(first?.id ?? Number.POSITIVE_INFINITY);
      expect((await storage.reviewLog.since(100)).map((e) => e.reviewedAt)).toEqual([200]);

      await storage.reviewLog.clear();
      await storage.reviewLog.putMany([{ ...logEntry(300), id: 41 }]);
      await storage.reviewLog.add(logEntry(400));
      expect((await storage.reviewLog.all()).map((e) => e.id)).toEqual([41, 42]);
      expect(await storage.reviewLog.count()).toBe(2);
    });

    it('a transaction stores all of its writes and returns the result', async () => {
      const storage = await create({ initialData });
      const result = await storage.transaction(async () => {
        await storage.concepts.remove('c1');
        await storage.positions.put(position({ id: 'p2' }));
        return (await storage.positions.count()) + 40;
      });
      expect(result).toBe(42);
      expect(await storage.concepts.get('c1')).toBeUndefined();
      expect(await storage.positions.get('p2')).toBeDefined();
    });

    it('a failing transaction undoes every write, across tables, and passes the error on', async () => {
      const storage = await create({ initialData });
      const attempt = storage.transaction(async () => {
        await storage.concepts.clear();
        await storage.positions.put(position({ id: 'p2' }));
        await storage.reviewLog.add(logEntry(1));
        throw new Error('boom');
      });
      await expect(attempt).rejects.toThrow('boom');
      expect(await storage.concepts.count()).toBe(2);
      expect(await storage.positions.get('p2')).toBeUndefined();
      expect(await storage.reviewLog.count()).toBe(0);
    });

    it('tells subscribers about committed changes until they unsubscribe', async () => {
      const storage = await create({ initialData });
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);

      await storage.concepts.put(concept({ id: 'c5' }));
      await vi.waitFor(() => expect(listener).toHaveBeenCalled());

      listener.mockClear();
      await storage.transaction(async () => {
        await storage.concepts.remove('c5');
        await storage.reviewLog.add(logEntry(1));
      });
      await vi.waitFor(() => expect(listener).toHaveBeenCalled());

      unsubscribe();
      // Let any notification still in flight land before counting from zero.
      await new Promise((resolve) => setTimeout(resolve, 20));
      listener.mockClear();
      await storage.concepts.put(concept({ id: 'c6' }));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(listener).not.toHaveBeenCalled();
    });

    it('reset returns to the initial data and tells subscribers', async () => {
      const storage = await create({ initialData });
      await storage.concepts.clear();
      await storage.positions.put(position({ id: 'p2' }));
      await storage.reviewLog.add(logEntry(1));
      const listener = vi.fn();
      storage.subscribe(listener);

      await storage.reset();

      expect((await storage.concepts.all()).map((c) => c.id).sort()).toEqual(['c1', 'c2']);
      expect(await storage.positions.count()).toBe(1);
      expect(await storage.reviewLog.count()).toBe(0);
      await vi.waitFor(() => expect(listener).toHaveBeenCalled());
      // Still usable afterwards.
      await storage.concepts.put(concept({ id: 'c7' }));
      expect(await storage.concepts.count()).toBe(3);
    });

    it.skipIf(!reopen)('keeps data across a restart and does not re-insert the initial data', async () => {
      const first = await create({ initialData });
      await first.concepts.remove('c1');
      await first.positions.put(position({ id: 'p2', name: 'Added' }));

      const second = await reopen?.({ initialData });

      expect(await second?.concepts.get('c1')).toBeUndefined();
      expect(await second?.concepts.get('c2')).toBeDefined();
      expect(await second?.positions.get('p2')).toMatchObject({ name: 'Added' });
    });
  });
}
