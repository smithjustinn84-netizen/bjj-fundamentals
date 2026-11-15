import { describe, expect, it } from 'vitest';
import { findMissingStarterTechniques } from './starter';
import { position, transition } from './testing/testFixtures';

describe('findMissingStarterTechniques', () => {
  const positions = [position({ id: 'guard' }), position({ id: 'mount' })];
  const starter = [
    transition({ id: 'sweep', fromId: 'guard', toId: 'mount' }),
    transition({ id: 'choke', type: 'submission', fromId: 'mount', toId: '' }),
    transition({ id: 'throw', fromId: 'standing', toId: 'mount' }),
    transition({ id: 'pull', fromId: 'guard', toId: 'standing' }),
  ];

  it('returns starter techniques that are not stored, including submissions with no destination', () => {
    const stored = [transition({ id: 'sweep', name: 'Renamed by the user' }), transition({ id: 'my-own' })];
    expect(findMissingStarterTechniques(starter, stored, positions, []).map((t) => t.id)).toEqual(['choke']);
  });

  it('leaves out techniques whose start or end position the library no longer has', () => {
    expect(findMissingStarterTechniques(starter, [], positions, []).map((t) => t.id)).toEqual(['sweep', 'choke']);
  });

  it('leaves out techniques the user dismissed', () => {
    const dismissed = [{ id: 'sweep', dismissedAt: 1 }];
    expect(findMissingStarterTechniques(starter, [], positions, dismissed).map((t) => t.id)).toEqual(['choke']);
  });

  it('is empty when everything is already stored', () => {
    expect(findMissingStarterTechniques(starter, starter, positions, [])).toEqual([]);
  });
});
