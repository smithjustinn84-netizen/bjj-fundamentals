import 'fake-indexeddb/auto';
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
