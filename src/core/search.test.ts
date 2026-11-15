import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import { searchLibrary } from './search';
import { concept, position, transition } from './testing/testFixtures';

const lib = buildLibrary(
  [concept({ id: 'frames', name: 'Frames', summary: 'Hold space with bones' })],
  [position({ id: 'mount', name: 'Mount', summary: 'Sitting on their chest' })],
  [
    transition({ id: 'upa', name: 'Bridge and roll escape', type: 'escape', fromId: 'mount', steps: ['Trap the arm'] }),
    transition({
      id: 'armbar',
      name: 'Armbar from mount',
      type: 'submission',
      fromId: 'mount',
      notes: 'Coach says frames',
    }),
  ],
  [],
);
const ids = (query: string, limit = 10) => searchLibrary(lib, query, limit).map((hit) => hit.id);

describe('searchLibrary', () => {
  it('finds nothing for an empty query', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
  });

  it('matches names ignoring case, and says what each hit is', () => {
    expect(searchLibrary(lib, 'ARMBAR', 10)).toEqual([
      { kind: 'transition', id: 'armbar', name: 'Armbar from mount', detail: 'Submission from Mount' },
    ]);
  });

  it('puts name matches before matches in the text', () => {
    // "Mount" is the position's name, part of one technique's name, and only the starting position of the other.
    expect(ids('mount')).toEqual(['mount', 'armbar', 'upa']);
    expect(ids('frames')).toEqual(['frames', 'armbar']);
  });

  it('needs every word, anywhere in the item', () => {
    expect(ids('escape trap')).toEqual(['upa']);
    expect(ids('escape frames')).toEqual([]);
  });

  it('stops at the limit', () => {
    expect(ids('mount', 2)).toEqual(['mount', 'armbar']);
  });
});
