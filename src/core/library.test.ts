import { describe, expect, it } from 'vitest';
import { buildLibrary, connections, itemName, itemsOfKind, reviewOf } from './library';
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

  it('lists the items of one kind in library order', () => {
    expect(itemsOfKind(lib, 'position').map((p) => p.id)).toEqual(['guard', 'mount']);
    expect(itemsOfKind(lib, 'concept').map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('has no study card for an item never reviewed', () => {
    expect(reviewOf(lib, 'position', 'mount')).toBeUndefined();
  });

  it('looks names up by kind and returns null for missing items', () => {
    expect(itemName(lib, 'position', 'mount')).toBe('Position');
    expect(itemName(lib, 'transition', 'orphan')).toBe('A');
    expect(itemName(lib, 'concept', 'nope')).toBeNull();
  });
});

describe('connections', () => {
  const lib = buildLibrary(
    [],
    [position({ id: 'guard' }), position({ id: 'mount' })],
    [
      transition({ id: 'sweep', fromId: 'guard', toId: 'mount' }),
      transition({ id: 'escape', fromId: 'mount', toId: 'guard' }),
      transition({ id: 'reguard', fromId: 'guard', toId: 'guard' }),
      transition({ id: 'choke', type: 'submission', fromId: 'mount', toId: '' }),
    ],
    [],
  );

  it('splits techniques into those leaving and those arriving, counting a loop once', () => {
    const { outgoing, incoming } = connections(lib, 'guard');
    expect(outgoing.map((t) => t.id).sort()).toEqual(['reguard', 'sweep']);
    expect(incoming.map((t) => t.id)).toEqual(['escape']);
  });

  it('includes submissions as outgoing', () => {
    expect(
      connections(lib, 'mount')
        .outgoing.map((t) => t.id)
        .sort(),
    ).toEqual(['choke', 'escape']);
  });
});
