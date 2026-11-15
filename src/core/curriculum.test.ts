import { describe, expect, it } from 'vitest';
import { lessonOrder, lessonTechniques } from './curriculum';
import { buildLibrary, type Library } from './library';
import { isEscape, isPin } from './models';
import { starterContent } from './seed';
import { concept, position, transition } from './testing/testFixtures';

const ids = (lib: Library) => lessonOrder(lib).map((item) => item.id);

describe('lessonOrder', () => {
  const concepts = [
    concept({ id: 'tap', order: 1 }),
    concept({ id: 'frames', order: 2 }),
    concept({ id: 'bridge', order: 3 }),
    concept({ id: 'manners', order: 4 }), // no position lists it
  ];
  const positions = [
    position({ id: 'guard', category: 'guard', order: 1, conceptIds: ['frames'] }),
    position({ id: 'mount', category: 'top', order: 2, conceptIds: ['bridge', 'frames'] }),
  ];
  const techniques = [
    transition({ id: 'armbar', name: 'A', type: 'submission', fromId: 'guard', role: 'bottom', toId: '' }),
    transition({ id: 'sweep', name: 'B', type: 'sweep', fromId: 'guard', role: 'bottom' }),
    transition({ id: 'choke', name: 'C', type: 'submission', fromId: 'mount', role: 'top', toId: '' }),
    transition({ id: 'defence', name: 'D', type: 'escape', fromId: 'mount', toId: 'mount', role: 'bottom' }),
    transition({ id: 'upa', name: 'E', type: 'escape', fromId: 'mount', toId: 'guard', role: 'bottom' }),
    transition({ id: 'lost', name: 'F', type: 'escape', fromId: 'deleted' }),
  ];

  it('teaches survival first: the pin, its escapes woven with its concepts, then attacks with submissions last', () => {
    expect(ids(buildLibrary(concepts, positions, techniques, []))).toEqual([
      'tap',
      // Survive: the pin comes before the guard although the guard is first in the list.
      'mount',
      // The way out of mount comes before the defence that leaves you under it.
      'upa',
      'frames',
      'defence',
      'bridge',
      'mount:bottom',
      'manners',
      'guard',
      // Attack: positions in their own order, the submission after the sweep.
      'sweep',
      'armbar',
      'guard:bottom',
      'choke',
      'mount:top',
      'lost',
    ]);
  });

  it('is empty for an empty library', () => {
    expect(lessonOrder(buildLibrary([], [], [], []))).toEqual([]);
  });

  it('gives every starter card exactly once, opening with safety and an escape from a pin', () => {
    const { concepts: c, positions: p, transitions: t } = starterContent(0);
    const lib = buildLibrary(c, p, t, []);
    const order = lessonOrder(lib);
    const keys = order.map((item) => `${item.kind}:${item.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    const situations = order.filter((item) => item.kind === 'situation').length;
    expect(order.length).toBe(c.length + p.length + t.length + situations);
    expect(order.slice(0, 3).map((item) => item.kind)).toEqual(['concept', 'position', 'transition']);
    expect(order[0]?.id).toBe(lib.concepts[0]?.id);
    const firstPosition = lib.positionById.get(order[1]?.id ?? '');
    expect(firstPosition && isPin(firstPosition.category)).toBe(true);

    const taught = lessonTechniques(lib);
    expect(taught.length).toBe(t.length);
    const firstAttack = taught.findIndex((technique) => !isEscape(technique.type));
    expect(taught.slice(firstAttack).some((technique) => isEscape(technique.type))).toBe(false);
    expect(taught[0]?.fromId).toBe(firstPosition?.id);
  });
});
