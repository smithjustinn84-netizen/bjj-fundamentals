import { describe, expect, it } from 'vitest';
import { buildLibrary, itemName } from './library';
import { concept, position, transition } from './testing/testFixtures';

describe('buildLibrary', () => {
  const lib = buildLibrary(
    [concept({ id: 'b', order: 2 }), concept({ id: 'a', order: 1 })],
    [position({ id: 'mount', order: 2 }), position({ id: 'guard', order: 1 })],
    [
      transition({ id: 'orphan', fromId: 'deleted', name: 'A' }),
      transition({ id: 'from-mount', fromId: 'mount', name: 'B' }),
      transition({ id: 'from-guard-z', fromId: 'guard', name: 'Z' }),
      transition({ id: 'from-guard-a', fromId: 'guard', name: 'A' }),
    ],
    [],
  );

  it('sorts concepts and positions by learning order', () => {
    expect(lib.concepts.map((c) => c.id)).toEqual(['a', 'b']);
    expect(lib.positions.map((p) => p.id)).toEqual(['guard', 'mount']);
  });

  it('sorts transitions by starting position, then name, with orphans last', () => {
    expect(lib.transitions.map((t) => t.id)).toEqual(['from-guard-a', 'from-guard-z', 'from-mount', 'orphan']);
  });

  it('looks names up by kind and returns null for missing items', () => {
    expect(itemName(lib, 'position', 'mount')).toBe('Position');
    expect(itemName(lib, 'transition', 'orphan')).toBe('A');
    expect(itemName(lib, 'concept', 'nope')).toBeNull();
  });
});
