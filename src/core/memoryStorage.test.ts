import { createMemoryStorage } from './memoryStorage';
import { describeStorageContract } from './testing/storageContract';

describeStorageContract('in-memory', { create: createMemoryStorage });
