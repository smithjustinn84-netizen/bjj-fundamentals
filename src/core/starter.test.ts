import { describe, expect, it } from 'vitest';
import { findMissingStarterConcepts, findMissingStarterTechniques, linkAddedConcepts } from './starter';
import { concept, position, transition } from './testing/testFixtures';

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

describe('findMissingStarterConcepts', () => {
  const starter = [concept({ id: 'base' }), concept({ id: 'angles' }), concept({ id: 'breathing' })];

  it('returns starter concepts that are not stored, whatever the stored copy now says', () => {
    const stored = [concept({ id: 'base', name: 'Renamed by the user' }), concept({ id: 'my-own' })];
    expect(findMissingStarterConcepts(starter, stored, []).map((c) => c.id)).toEqual(['angles', 'breathing']);
  });

  it('leaves out concepts the user dismissed', () => {
    const dismissed = [{ id: 'angles', dismissedAt: 1 }];
    expect(findMissingStarterConcepts(starter, [], dismissed).map((c) => c.id)).toEqual(['base', 'breathing']);
  });

  it('is empty when everything is already stored', () => {
    expect(findMissingStarterConcepts(starter, starter, [])).toEqual([]);
  });
});

describe('linkAddedConcepts', () => {
  const starterPositions = [
    position({ id: 'guard', conceptIds: ['base', 'angles'] }),
    position({ id: 'mount', conceptIds: ['breathing', 'angles'] }),
  ];

  it('appends added concepts to stored starter positions that list them, after the user’s own links', () => {
    const stored = [position({ id: 'guard', conceptIds: ['mine'] }), position({ id: 'mount', conceptIds: [] })];
    const linked = linkAddedConcepts(new Set(['angles']), starterPositions, stored);
    expect(linked.map((p) => [p.id, p.conceptIds])).toEqual([
      ['guard', ['mine', 'angles']],
      ['mount', ['angles']],
    ]);
  });

  it('leaves out positions that already list the concept, that are not starter positions, or are gone', () => {
    const stored = [position({ id: 'guard', conceptIds: ['angles'] }), position({ id: 'my-own', conceptIds: [] })];
    expect(linkAddedConcepts(new Set(['angles']), starterPositions, stored)).toEqual([]);
  });

  it('only links concepts that were added', () => {
    const stored = [position({ id: 'guard', conceptIds: [] })];
    expect(linkAddedConcepts(new Set(['breathing']), starterPositions, stored)).toEqual([]);
  });
});
