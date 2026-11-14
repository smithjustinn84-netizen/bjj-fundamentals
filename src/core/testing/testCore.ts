import { createCore } from '../core';
import { createMemoryStorage } from '../memoryStorage';
import { starterContent } from '../seed';

/** A fixed, readable "now" for tests: local noon on 14 Nov 2026. */
export const TEST_NOW = new Date(2026, 10, 14, 12).getTime();

/**
 * A core running on in-memory storage with the starter content, predictable ids ("id-1", "id-2", ...)
 * and a clock the test controls through `clock.now`.
 */
export function testCore() {
  const clock = { now: TEST_NOW };
  let lastId = 0;
  const storage = createMemoryStorage({ initialData: starterContent(TEST_NOW) });
  const core = createCore({
    storage,
    newId: () => {
      lastId += 1;
      return `id-${lastId}`;
    },
    now: () => clock.now,
  });
  return { core, storage, clock };
}
