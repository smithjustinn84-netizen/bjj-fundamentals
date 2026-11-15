import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import { endsTheRoll } from './models';
import { defaultEndRole, defaultRole, endRole, performerRole, positionOptions } from './roles';
import { starterContent } from './seed';
import { position, transition } from './testing/testFixtures';

const positions = [
  position({ id: 'guard', category: 'guard', order: 1 }),
  position({ id: 'mount', category: 'top', order: 2 }),
];

describe('performerRole', () => {
  it('uses the stored role when there is one', () => {
    const sweep = transition({ id: 'scissor-sweep', type: 'sweep', fromId: 'guard', role: 'top' });
    expect(performerRole(buildLibrary([], positions, [sweep], []), sweep)).toBe('top');
  });

  it('gives a starter technique stored without a role the starter answer', () => {
    // By type alone this would be "top": the starter content knows it is done from inside the guard's bottom.
    const stored = transition({ id: 'half-to-full-guard', type: 'transition', fromId: 'guard' });
    expect(performerRole(buildLibrary([], positions, [stored], []), stored)).toBe('bottom');
  });

  it('falls back to the usual role for the type, and for a submission to where it starts', () => {
    const fromGuard = transition({ id: 'my-armbar', type: 'submission', fromId: 'guard' });
    const fromMount = transition({ id: 'my-choke', type: 'submission', fromId: 'mount' });
    const lib = buildLibrary([], positions, [fromGuard, fromMount], []);
    expect(performerRole(lib, fromGuard)).toBe('bottom');
    expect(performerRole(lib, fromMount)).toBe('top');
    expect(defaultRole('escape', 'top')).toBe('bottom');
    expect(defaultRole('pass', undefined)).toBe('top');
  });
});

describe('positionOptions', () => {
  it('splits the techniques that start at a position by who does them', () => {
    const lib = buildLibrary(
      [],
      positions,
      [
        transition({ id: 'pass', name: 'Pass', type: 'pass', fromId: 'guard', role: 'top' }),
        transition({ id: 'sweep', name: 'Sweep', type: 'sweep', fromId: 'guard', role: 'bottom' }),
        transition({ id: 'armbar', name: 'Armbar', type: 'submission', fromId: 'guard', role: 'bottom' }),
        transition({ id: 'escape', name: 'Escape', type: 'escape', fromId: 'mount', toId: 'guard', role: 'bottom' }),
      ],
      [],
    );
    const options = positionOptions(lib, 'guard');
    expect(options.top.map((t) => t.id)).toEqual(['pass']);
    expect(options.bottom.map((t) => t.id)).toEqual(['armbar', 'sweep']);
    // Nothing for the person on top of mount: a gap.
    expect(positionOptions(lib, 'mount').top).toEqual([]);
  });

  it('gives both people something to do from every starter position', () => {
    const starter = starterContent(0);
    const lib = buildLibrary(starter.concepts, starter.positions, starter.transitions, []);
    const gaps = starter.positions.flatMap((p) => {
      const options = positionOptions(lib, p.id);
      return [...(options.top.length ? [] : [`${p.id} top`]), ...(options.bottom.length ? [] : [`${p.id} bottom`])];
    });
    expect(gaps).toEqual([]);
  });
});

describe('endRole', () => {
  const lib = buildLibrary([], positions, [], []);

  it('uses the stored side, then the starter answer', () => {
    expect(endRole(lib, transition({ id: 'back-escape', type: 'escape', endRole: 'bottom' }))).toBe('bottom');
    // Escaping the back by the starter method leaves you on top, in their guard.
    expect(endRole(lib, transition({ id: 'back-escape', type: 'escape' }))).toBe('top');
  });

  it('otherwise puts a sweep, pass or takedown on top and leaves anything else on its starting side', () => {
    expect(endRole(lib, transition({ id: 'my-sweep', type: 'sweep', fromId: 'guard' }))).toBe('top');
    expect(endRole(lib, transition({ id: 'my-escape', type: 'escape', fromId: 'mount' }))).toBe('bottom');
    expect(endRole(lib, transition({ id: 'my-move', type: 'transition', fromId: 'mount', role: 'bottom' }))).toBe(
      'bottom',
    );
  });

  it('has a usual side for each type that the technique form can show before anything is saved', () => {
    expect(defaultEndRole('sweep', 'bottom')).toBe('top');
    expect(defaultEndRole('escape', 'bottom')).toBe('bottom');
    expect(defaultEndRole('submission', 'top')).toBeNull();
  });

  it('is nothing for a submission, and set for every other starter technique', () => {
    expect(endRole(lib, transition({ id: 'my-choke', type: 'submission', fromId: 'mount' }))).toBeNull();
    const unset = starterContent(0).transitions.filter((t) => !endsTheRoll(t.type) && !t.endRole);
    expect(unset.map((t) => t.id)).toEqual([]);
  });
});
