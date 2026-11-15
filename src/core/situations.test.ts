import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import { allSituations, findSituation, situationId, situationName, situationPositionId } from './situations';
import { position, transition } from './testing/testFixtures';

const lib = buildLibrary(
  [],
  [
    position({ id: 'guard', name: 'Closed Guard', category: 'guard', order: 1 }),
    position({ id: 'mount', name: 'Mount', category: 'top', order: 2 }),
  ],
  [
    transition({ id: 'sweep', type: 'sweep', fromId: 'guard', role: 'bottom' }),
    transition({ id: 'pass', type: 'pass', fromId: 'guard', role: 'top' }),
    transition({ id: 'escape', type: 'escape', fromId: 'mount', role: 'bottom' }),
  ],
  [],
);

describe('situations', () => {
  it('lists each side of each position that has something to do, in learning order', () => {
    expect(allSituations(lib).map((s) => situationId(s.position.id, s.role))).toEqual([
      'guard:top',
      'guard:bottom',
      'mount:bottom',
    ]);
  });

  it('finds a situation by id with its options, and names it', () => {
    const found = findSituation(lib, 'mount:bottom');
    expect(found?.options.map((t) => t.id)).toEqual(['escape']);
    expect(found && situationName(found)).toBe('Mount, underneath');
  });

  it('finds nothing for a side with no options, a missing position or a bad id', () => {
    expect(findSituation(lib, 'mount:top')).toBeNull();
    expect(findSituation(lib, 'gone:bottom')).toBeNull();
    expect(findSituation(lib, 'mount')).toBeNull();
    expect(findSituation(lib, 'mount:sideways')).toBeNull();
  });

  it('keeps a position id that contains a colon intact', () => {
    expect(situationPositionId(situationId('my:position', 'top'))).toBe('my:position');
  });
});
