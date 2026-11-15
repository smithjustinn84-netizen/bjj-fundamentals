import { describe, expect, it } from 'vitest';
import { hasLinks, techniqueLinks } from './chains';
import { buildLibrary } from './library';
import { starterContent } from './seed';
import { transition } from './testing/testFixtures';

const starter = starterContent(0);
const lib = buildLibrary(starter.concepts, starter.positions, starter.transitions, []);
const ids = (techniques: { id: string }[]) => techniques.map((t) => t.id);

describe('techniqueLinks', () => {
  it('pairs an attack with its defence in both directions', () => {
    expect(ids(techniqueLinks(lib, 'armbar-guard').defences)).toEqual(['armbar-defence']);
    expect(ids(techniqueLinks(lib, 'armbar-defence').answers)).toEqual(['armbar-guard']);
    expect(ids(techniqueLinks(lib, 'sprawl').answers)).toEqual(['double-leg', 'single-leg']);
  });

  it('lists what to switch to when a technique is stopped, with the reaction that calls for each', () => {
    expect(techniqueLinks(lib, 'hip-bump-sweep').followUps.map((f) => [f.technique.id, f.when])).toEqual([
      ['kimura-guard', 'when they post a hand on the mat to stop the bump'],
      ['guillotine-guard', 'when they pull the arm back and leave the head low'],
    ]);
    expect(ids(techniqueLinks(lib, 'elbow-knee-escape').followUps.map((f) => f.technique))).toEqual(['upa-escape']);
  });

  it('names only starter techniques: every pair and every dilemma resolves in the starter library', () => {
    const all = starter.transitions.map((t) => techniqueLinks(lib, t.id));
    const count = (pick: (links: (typeof all)[number]) => unknown[]) => all.reduce((n, l) => n + pick(l).length, 0);
    // 8 attack and defence pairs; dilemmas of 3, 3, 2 and 2 techniques, each pointing at the others in its group.
    expect(count((l) => l.defences)).toBe(8);
    expect(count((l) => l.answers)).toBe(8);
    expect(count((l) => l.followUps)).toBe(3 * 2 + 3 * 2 + 2 + 2);
  });

  it('leaves out techniques the library no longer has, and has nothing for a technique the user added', () => {
    const without = buildLibrary(
      [],
      starter.positions,
      [transition({ id: 'armbar-guard' }), transition({ id: 'own' })],
      [],
    );
    expect(hasLinks(techniqueLinks(without, 'armbar-guard'))).toBe(false);
    expect(hasLinks(techniqueLinks(without, 'own'))).toBe(false);
    expect(hasLinks(techniqueLinks(lib, 'armbar-guard'))).toBe(true);
  });
});
