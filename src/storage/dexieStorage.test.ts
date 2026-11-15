import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { starterContent } from '../core/seed';
import { describeStorageContract } from '../core/testing/storageContract';
import { createDexieStorage } from './dexieStorage';

let databases = 0;
const currentName = () => `contract-${databases}`;

describeStorageContract('IndexedDB (Dexie)', {
  create(options) {
    databases += 1;
    return createDexieStorage({ ...options, name: currentName() });
  },
  reopen: (options) => createDexieStorage({ ...options, name: currentName() }),
});

describe('Dexie schema upgrades', () => {
  it('seeds starter videos when upgrading a version 1 database that had none', async () => {
    const name = 'upgrade-v1-to-v2';
    const v1 = new Dexie(name);
    v1.version(1).stores({
      positions: 'id, category, order, name',
      transitions: 'id, type, fromId, toId, name',
      concepts: 'id, order, name',
      videos: 'id, youtubeId, [linkedKind+linkedId], createdAt',
      reviews: 'id, kind, itemId, due',
      reviewLog: '++id, cardId, reviewedAt',
    });
    await v1.open();
    v1.close();

    const initialData = starterContent(1000);
    const storage = createDexieStorage({ name, initialData });
    expect((await storage.videos.all()).length).toBe(initialData.videos.length);
  });

  it('adds newly seeded starter videos when upgrading a version 5 database', async () => {
    const name = 'upgrade-v5-to-v6';
    const v5 = new Dexie(name);
    v5.version(5).stores({
      positions: 'id, category, order, name',
      transitions: 'id, type, fromId, toId, name',
      concepts: 'id, order, name',
      videos: 'id, youtubeId, [linkedKind+linkedId], createdAt',
      reviews: 'id, kind, itemId, due',
      reviewLog: '++id, cardId, reviewedAt',
      starterDismissals: 'id',
      trainingLog: 'id, day',
    });
    await v5.open();
    v5.close();

    const initialData = starterContent(1000);
    const storage = createDexieStorage({ name, initialData });
    expect((await storage.videos.all()).length).toBe(initialData.videos.length);
  });

  it('adds newly seeded starter videos when upgrading a version 6 database', async () => {
    const name = 'upgrade-v6-to-v7';
    const v6 = new Dexie(name);
    v6.version(6).stores({
      positions: 'id, category, order, name',
      transitions: 'id, type, fromId, toId, name',
      concepts: 'id, order, name',
      videos: 'id, youtubeId, [linkedKind+linkedId], createdAt',
      reviews: 'id, kind, itemId, due',
      reviewLog: '++id, cardId, reviewedAt',
      starterDismissals: 'id',
      trainingLog: 'id, day',
    });
    await v6.open();
    v6.close();

    const initialData = starterContent(1000);
    const storage = createDexieStorage({ name, initialData });
    expect((await storage.videos.all()).length).toBe(initialData.videos.length);
  });

  it('refreshes unedited starter items and preserves edited ones when upgrading a version 8 database', async () => {
    const name = 'upgrade-v8-to-v9';
    const initialData = starterContent(1000);
    const v8 = new Dexie(name);
    v8.version(8).stores({
      positions: 'id, category, order, name',
      transitions: 'id, type, fromId, toId, name',
      concepts: 'id, order, name',
      videos: 'id, youtubeId, [linkedKind+linkedId], createdAt',
      reviews: 'id, kind, itemId, due',
      reviewLog: '++id, cardId, reviewedAt',
      starterDismissals: 'id',
      trainingLog: 'id, day',
      settings: 'id',
    });
    await v8.open();
    const firstConcept = initialData.concepts[0];
    const secondConcept = initialData.concepts[1];
    if (!firstConcept || !secondConcept) throw new Error('expected starter concepts');
    await v8.table('concepts').bulkAdd([
      { ...firstConcept, summary: 'Outdated coaching summary', createdAt: 500, updatedAt: 500 },
      { ...secondConcept, summary: 'User edited summary', createdAt: 500, updatedAt: 600 },
    ]);
    v8.close();

    const storage = createDexieStorage({ name, initialData });
    const upgradedFirst = await storage.concepts.get(firstConcept.id);
    const upgradedSecond = await storage.concepts.get(secondConcept.id);
    expect(upgradedFirst?.summary).toBe(firstConcept.summary);
    expect(upgradedFirst?.createdAt).toBe(500);
    expect(upgradedSecond?.summary).toBe('User edited summary');
  });
});
