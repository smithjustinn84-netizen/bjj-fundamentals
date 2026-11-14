import { describe, expect, it } from 'vitest';
import { createItemRepository } from './itemRepository';
import { createReviewRepository } from './reviewRepository';
import { freshDb } from './testDb';
import { createVideoRepository } from './videoRepository';

const video = { title: 'Clip', youtubeId: 'dQw4w9WgXcQ', startSeconds: 0, note: '' };

describe('saving items', () => {
  it('creates with a new id and timestamps, then updates keeping createdAt', async () => {
    const db = freshDb();
    const items = createItemRepository(db);
    const input = { name: 'Balance', summary: '', keyPoints: ['a'], drill: '', order: 99, notes: '' };

    const id = await items.saveConcept(null, input, 1000);
    expect(await db.concepts.get(id)).toMatchObject({ name: 'Balance', createdAt: 1000, updatedAt: 1000 });

    const sameId = await items.saveConcept(id, { ...input, name: 'Balance 2' }, 2000);
    expect(sameId).toBe(id);
    expect(await db.concepts.get(id)).toMatchObject({ name: 'Balance 2', createdAt: 1000, updatedAt: 2000 });
  });
});

describe('deleting items', () => {
  it('deleting a position removes its transitions and their review cards, and unlinks videos', async () => {
    const db = freshDb();
    const items = createItemRepository(db);
    const reviews = createReviewRepository(db);
    const videos = createVideoRepository(db);
    await reviews.recordReview({ kind: 'position', id: 'mount' }, 'good');
    await reviews.recordReview({ kind: 'transition', id: 'upa-escape' }, 'good'); // from mount
    await reviews.recordReview({ kind: 'transition', id: 'scissor-sweep' }, 'good'); // into mount
    await reviews.recordReview({ kind: 'transition', id: 'toreando-pass' }, 'good'); // unrelated
    const onPosition = await videos.add({ ...video, linkedKind: 'position', linkedId: 'mount' });
    const onTransition = await videos.add({ ...video, linkedKind: 'transition', linkedId: 'upa-escape' });
    const elsewhere = await videos.add({ ...video, linkedKind: 'position', linkedId: 'turtle' });

    await items.deleteItem('position', 'mount');

    expect(await db.positions.get('mount')).toBeUndefined();
    expect(await db.transitions.where('fromId').equals('mount').or('toId').equals('mount').count()).toBe(0);
    expect(await db.transitions.get('toreando-pass')).toBeDefined();
    expect((await db.reviews.toCollection().primaryKeys()).sort()).toEqual(['transition:toreando-pass']);
    expect(await db.videos.get(onPosition)).toMatchObject({ linkedKind: '', linkedId: '' });
    expect(await db.videos.get(onTransition)).toMatchObject({ linkedKind: '', linkedId: '' });
    expect(await db.videos.get(elsewhere)).toMatchObject({ linkedKind: 'position', linkedId: 'turtle' });
  });

  it('deleting a concept removes it from every position that referenced it', async () => {
    const db = freshDb();
    expect((await db.positions.get('mount'))?.conceptIds).toContain('base');

    await createItemRepository(db).deleteItem('concept', 'base');

    expect(await db.concepts.get('base')).toBeUndefined();
    const stillReferencing = (await db.positions.toArray()).filter((p) => p.conceptIds.includes('base'));
    expect(stillReferencing).toEqual([]);
  });

  it('deleting a transition leaves its positions alone', async () => {
    const db = freshDb();
    const positionsBefore = await db.positions.count();

    await createItemRepository(db).deleteItem('transition', 'upa-escape');

    expect(await db.transitions.get('upa-escape')).toBeUndefined();
    expect(await db.positions.count()).toBe(positionsBefore);
  });
});
