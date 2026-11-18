import { describe, expect, it } from 'vitest';
import { lessonOrder, lessonTechniques } from './curriculum';
import { buildLibrary, type Library } from './library';
import { starterContent } from './seed';
import { concept, position, transition } from './testing/testFixtures';

const ids = (lib: Library) => lessonOrder(lib).map((item) => item.id);

describe('lessonOrder', () => {
  const concepts = [
    concept({ id: 'x-tap', order: 1 }),
    concept({ id: 'x-frames', order: 2 }),
    concept({ id: 'x-bridge', order: 3 }),
    concept({ id: 'x-manners', order: 4 }), // no position lists it
  ];
  const positions = [
    position({ id: 'x-guard', category: 'guard', order: 1, conceptIds: ['x-frames'] }),
    position({ id: 'x-mount', category: 'top', order: 2, conceptIds: ['x-bridge', 'x-frames'] }),
  ];
  const techniques = [
    transition({ id: 'x-armbar', name: 'A', type: 'submission', fromId: 'x-guard', role: 'bottom', toId: '' }),
    transition({ id: 'x-sweep', name: 'B', type: 'sweep', fromId: 'x-guard', role: 'bottom' }),
    transition({ id: 'x-choke', name: 'C', type: 'submission', fromId: 'x-mount', role: 'top', toId: '' }),
    transition({ id: 'x-defence', name: 'D', type: 'escape', fromId: 'x-mount', toId: 'x-mount', role: 'bottom' }),
    transition({ id: 'x-upa', name: 'E', type: 'escape', fromId: 'x-mount', toId: 'x-guard', role: 'bottom' }),
    transition({ id: 'x-lost', name: 'F', type: 'escape', fromId: 'deleted' }),
  ];

  it('teaches survival first: the pin, its escapes woven with its concepts, then attacks with submissions last', () => {
    expect(ids(buildLibrary(concepts, positions, techniques, []))).toEqual([
      'x-tap',
      // Survive: the pin comes before the guard although the guard is first in the list.
      'x-mount',
      // The way out of mount comes before the defence that leaves you under it.
      'x-upa',
      'x-frames',
      'x-defence',
      'x-bridge',
      'x-mount:bottom',
      'x-manners',
      'x-guard',
      // Attack: positions in their own order, the submission after the sweep.
      'x-sweep',
      'x-armbar',
      'x-guard:bottom',
      'x-choke',
      'x-mount:top',
      'x-lost',
    ]);
  });

  it('is empty for an empty library', () => {
    expect(lessonOrder(buildLibrary([], [], [], []))).toEqual([]);
  });

  it('gives every starter card exactly once, the foundation lessons first: day-one safety then survival', () => {
    const { concepts: c, positions: p, transitions: t } = starterContent(0);
    const lib = buildLibrary(c, p, t, []);
    const order = lessonOrder(lib);
    const keys = order.map((item) => `${item.kind}:${item.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    const situations = order.filter((item) => item.kind === 'situation').length;
    expect(order.length).toBe(c.length + p.length + t.length + situations);
    expect(keys.slice(0, 5)).toEqual([
      'concept:safety',
      'transition:technical-stand-up',
      'concept:breakfalls',
      'concept:training-partner',
      'concept:roll-to-learn',
    ]);
    const taught = lessonTechniques(lib).map((technique) => technique.id);
    expect(taught.length).toBe(t.length);
    // The mount escapes come before anything from the closed guard.
    expect(taught.indexOf('elbow-knee-escape')).toBeLessThan(taught.indexOf('scissor-sweep'));
    // Escapes from a pin come before submissions from one.
    expect(taught.indexOf('side-control-escape-knees')).toBeLessThan(taught.indexOf('cross-collar-choke'));
  });
});
