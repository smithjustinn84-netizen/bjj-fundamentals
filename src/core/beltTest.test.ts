import { describe, expect, it } from 'vitest';
import { blueBeltTestList, isOnBlueBeltTest } from './beltTest';
import { buildLibrary } from './library';
import { STARTER_BLUE_BELT_TEST_IDS, starterContent } from './seed';
import { position, review, transition } from './testing/testFixtures';

describe('isOnBlueBeltTest', () => {
  it('uses the stored flag when there is one', () => {
    expect(isOnBlueBeltTest(transition({ blueBeltTest: true }))).toBe(true);
    expect(isOnBlueBeltTest(transition({ blueBeltTest: false }))).toBe(false);
    // A starter technique the user took off the list stays off.
    expect(isOnBlueBeltTest(transition({ id: 'scissor-sweep', blueBeltTest: false }))).toBe(false);
  });

  it('defaults techniques stored before the flag existed: starter ones on, the rest off', () => {
    expect(isOnBlueBeltTest(transition({ id: 'scissor-sweep' }))).toBe(true);
    expect(isOnBlueBeltTest(transition({ id: 'my-own-move' }))).toBe(false);
  });

  it('matches STARTER_BLUE_BELT_TEST_IDS in a fresh installation, excluding self-defense drills and omoplata', () => {
    const { transitions } = starterContent(0);
    expect(transitions.length).toBeGreaterThan(0);
    expect(transitions.every((t) => t.blueBeltTest === STARTER_BLUE_BELT_TEST_IDS.has(t.id))).toBe(true);
    const off = transitions.filter((t) => !t.blueBeltTest).map((t) => t.id);
    expect(off).toEqual([
      'wrist-grab-release',
      'front-choke-defence',
      'bear-hug-escape',
      'standing-headlock-escape',
      'omoplata-guard',
      'ground-headlock-escape',
    ]);
  });
});

describe('blueBeltTestList', () => {
  const lib = buildLibrary(
    [],
    [position({ id: 'guard', order: 1 }), position({ id: 'mount', order: 2 })],
    [
      transition({ id: 'choke', type: 'submission', fromId: 'mount', blueBeltTest: true }),
      transition({ id: 'armbar', type: 'submission', fromId: 'guard', blueBeltTest: true }),
      transition({ id: 'sweep', type: 'sweep', fromId: 'guard', blueBeltTest: true }),
      transition({ id: 'not-tested', type: 'pass', fromId: 'guard', blueBeltTest: false }),
    ],
    [
      review('transition', 'armbar', { intervalDays: 5, repetitions: 1 }),
      review('transition', 'sweep', { intervalDays: 1, repetitions: 1 }),
      review('transition', 'not-tested', { intervalDays: 5, repetitions: 1 }),
    ],
  );

  it('groups listed techniques by type in type order, leaving out empty types', () => {
    const list = blueBeltTestList(lib);
    expect(list.groups.map((g) => [g.type, g.techniques.map((t) => t.id)])).toEqual([
      ['sweep', ['sweep']],
      ['submission', ['armbar', 'choke']],
    ]);
  });

  it('counts only listed techniques, and only learned cards as learned', () => {
    const list = blueBeltTestList(lib);
    expect(list.total).toBe(3);
    expect(list.learned).toBe(1);
  });

  it('is empty when nothing is on the list', () => {
    expect(blueBeltTestList(buildLibrary([], [], [transition({ id: 'x' })], []))).toEqual({
      groups: [],
      total: 0,
      learned: 0,
    });
  });
});
