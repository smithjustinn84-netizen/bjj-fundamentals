import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { BjjDB } from './db';

let counter = 0;
const open: BjjDB[] = [];

/** A fresh in-memory database (with starter content) that is deleted after the current test. */
export function freshDb(): BjjDB {
  counter += 1;
  const db = new BjjDB(`test-${counter}`);
  open.push(db);
  return db;
}

afterEach(async () => {
  await Promise.all(open.splice(0).map((db) => db.delete()));
});
