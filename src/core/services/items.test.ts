import { describe, expect, it } from 'vitest';
import { testCore } from '../testing/testCore';

const video = { title: 'Clip', youtubeId: 'dQw4w9WgXcQ', startSeconds: 0, note: '' };

describe('saving items', () => {
  it('creates with a new id and timestamps, then updates keeping createdAt', async () => {
    const { core, storage, clock } = testCore();
    const input = { name: 'Balance', summary: '', keyPoints: ['a'], drill: '', order: 99, notes: '' };

    clock.now = 1000;
    const id = await core.items.saveConcept(null, input);
    expect(await storage.concepts.get(id)).toMatchObject({ name: 'Balance', createdAt: 1000, updatedAt: 1000 });

    clock.now = 2000;
    const sameId = await core.items.saveConcept(id, { ...input, name: 'Balance 2' });
    expect(sameId).toBe(id);
    expect(await storage.concepts.get(id)).toMatchObject({ name: 'Balance 2', createdAt: 1000, updatedAt: 2000 });
  });
});

describe('deleting items', () => {
  it('deleting a position removes its transitions and their review cards, and unlinks videos', async () => {
    const { core, storage } = testCore();
    await core.reviews.recordReview({ kind: 'position', id: 'mount' }, 'good');
    await core.reviews.recordReview({ kind: 'transition', id: 'upa-escape' }, 'good'); // from mount
    await core.reviews.recordReview({ kind: 'transition', id: 'scissor-sweep' }, 'good'); // into mount
    await core.reviews.recordReview({ kind: 'transition', id: 'toreando-pass' }, 'good'); // unrelated
    const onPosition = await core.videos.add({ ...video, linkedKind: 'position', linkedId: 'mount' });
    const onTransition = await core.videos.add({ ...video, linkedKind: 'transition', linkedId: 'upa-escape' });
    const elsewhere = await core.videos.add({ ...video, linkedKind: 'position', linkedId: 'turtle' });

    await core.items.deleteItem('position', 'mount');

    expect(await storage.positions.get('mount')).toBeUndefined();
    const transitions = await storage.transitions.all();
    expect(transitions.filter((t) => t.fromId === 'mount' || t.toId === 'mount')).toEqual([]);
    expect(transitions.some((t) => t.id === 'toreando-pass')).toBe(true);
    expect((await storage.reviews.all()).map((r) => r.id)).toEqual(['transition:toreando-pass']);
    expect(await storage.videos.get(onPosition)).toMatchObject({ linkedKind: '', linkedId: '' });
    expect(await storage.videos.get(onTransition)).toMatchObject({ linkedKind: '', linkedId: '' });
    expect(await storage.videos.get(elsewhere)).toMatchObject({ linkedKind: 'position', linkedId: 'turtle' });
  });

  it('deleting a concept removes it from every position that referenced it', async () => {
    const { core, storage } = testCore();
    expect((await storage.positions.get('mount'))?.conceptIds).toContain('base');

    await core.items.deleteItem('concept', 'base');

    expect(await storage.concepts.get('base')).toBeUndefined();
    expect((await storage.positions.all()).filter((p) => p.conceptIds.includes('base'))).toEqual([]);
  });

  it('deleting a transition leaves its positions alone', async () => {
    const { core, storage } = testCore();
    const positionsBefore = await storage.positions.count();

    await core.items.deleteItem('transition', 'upa-escape');

    expect(await storage.transitions.get('upa-escape')).toBeUndefined();
    expect(await storage.positions.count()).toBe(positionsBefore);
  });
});
