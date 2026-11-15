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
});
