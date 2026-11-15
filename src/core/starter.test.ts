import { describe, expect, it } from 'vitest';
import {
  findMissingStarterConcepts,
  findMissingStarterTechniques,
  linkAddedConcepts,
  refreshStarterCopy,
} from './starter';
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

describe('refreshStarterCopy', () => {
  const starter = {
    concepts: [
      concept({
        id: 'base',
        summary: 'Fresh base summary',
        keyPoints: ['Active toes'],
        createdAt: 999,
        updatedAt: 999,
      }),
    ],
    positions: [
      position({
        id: 'guard',
        summary: 'Fresh guard summary',
        topGoals: ['Posture'],
        conceptIds: ['base'],
        createdAt: 999,
        updatedAt: 999,
      }),
    ],
    transitions: [
      transition({
        id: 'sweep',
        steps: ['New step 1', 'New step 2'],
        blueBeltTest: true,
        createdAt: 999,
        updatedAt: 999,
      }),
    ],
  };

  it('refreshes unedited starter items while keeping their stored timestamps, concept links and blue belt flag', () => {
    const stored = {
      concepts: [concept({ id: 'base', summary: 'Old summary', createdAt: 10, updatedAt: 10 })],
      positions: [
        position({ id: 'guard', summary: 'Old guard', conceptIds: ['my-concept'], createdAt: 20, updatedAt: 20 }),
      ],
      transitions: [
        transition({ id: 'sweep', steps: ['Old step'], blueBeltTest: false, createdAt: 30, updatedAt: 30 }),
      ],
    };
    const refreshed = refreshStarterCopy(starter, stored);
    expect(refreshed.concepts).toEqual([
      concept({ id: 'base', summary: 'Fresh base summary', keyPoints: ['Active toes'], createdAt: 10, updatedAt: 10 }),
    ]);
    expect(refreshed.positions).toEqual([
      position({
        id: 'guard',
        summary: 'Fresh guard summary',
        topGoals: ['Posture'],
        conceptIds: ['my-concept'],
        createdAt: 20,
        updatedAt: 20,
      }),
    ]);
    expect(refreshed.transitions).toEqual([
      transition({
        id: 'sweep',
        steps: ['New step 1', 'New step 2'],
        blueBeltTest: false,
        createdAt: 30,
        updatedAt: 30,
      }),
    ]);
  });

  it('skips starter items the user edited or added notes to, and user-created items', () => {
    const stored = {
      concepts: [
        concept({ id: 'base', summary: 'User edited', createdAt: 10, updatedAt: 15 }),
        concept({ id: 'custom-concept', createdAt: 10, updatedAt: 10 }),
      ],
      positions: [position({ id: 'guard', notes: 'My class note', createdAt: 20, updatedAt: 20 })],
      transitions: [transition({ id: 'sweep', createdAt: 30, updatedAt: 40 })],
    };
    expect(refreshStarterCopy(starter, stored)).toEqual({
      concepts: [],
      positions: [],
      transitions: [],
    });
  });
});
