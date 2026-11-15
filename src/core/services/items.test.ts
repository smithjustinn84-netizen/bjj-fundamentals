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

  it('stores no destination for a submission, whatever the caller passed', async () => {
    const { core, storage } = testCore();
    const input = {
      name: 'Choke',
      type: 'submission' as const,
      fromId: 'mount',
      toId: 'back-control',
      steps: [],
      commonMistakes: [],
      notes: '',
    };
    const id = await core.items.saveTransition(null, input);
    expect(await storage.transitions.get(id)).toMatchObject({ toId: '' });

    const sweep = await core.items.saveTransition(null, { ...input, type: 'sweep' });
    expect(await storage.transitions.get(sweep)).toMatchObject({ toId: 'back-control' });
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

describe('adding missing starter techniques', () => {
  it('adds back what is missing without touching stored techniques, and only once', async () => {
    const { core, storage, clock } = testCore();
    const before = await storage.transitions.count();
    expect(await core.queries.missingStarterTechniques()).toEqual([]);

    await core.items.deleteItem('transition', 'triangle-choke');
    await core.items.deleteItem('transition', 'kimura-guard');
    const edited = await storage.transitions.get('scissor-sweep');
    if (!edited) throw new Error('starter content has no scissor sweep');
    await storage.transitions.put({ ...edited, notes: 'mine' });
    expect((await core.queries.missingStarterTechniques()).map((t) => t.id)).toEqual([
      'triangle-choke',
      'kimura-guard',
    ]);

    clock.now += 5000;
    expect(await core.items.addMissingStarterTechniques()).toBe(2);
    expect(await storage.transitions.count()).toBe(before);
    expect(await storage.transitions.get('triangle-choke')).toMatchObject({ blueBeltTest: true, createdAt: clock.now });
    expect(await storage.transitions.get('scissor-sweep')).toMatchObject({ notes: 'mine' });
    // Deleting a technique keeps its bookmark, unlinked, so only that one is not re-added.
    expect(await storage.videos.get('video-triangle-choke')).toMatchObject({ linkedId: '' });

    expect(await core.items.addMissingStarterTechniques()).toBe(0);
  });

  it('brings the starter video for a technique the library never had', async () => {
    const { core, storage } = testCore();
    // A library set up before the armbar from mount was added to the starter content.
    await storage.transitions.remove('armbar-mount');
    await storage.videos.remove('video-armbar-mount');

    expect(await core.items.addMissingStarterTechniques()).toBe(1);
    expect(await storage.videos.get('video-armbar-mount')).toMatchObject({
      linkedKind: 'transition',
      linkedId: 'armbar-mount',
    });
  });

  it('skips techniques whose position was deleted', async () => {
    const { core, storage } = testCore();
    await core.items.deleteItem('position', 'mount');
    expect(await core.items.addMissingStarterTechniques()).toBe(0);
    expect((await storage.transitions.all()).some((t) => t.fromId === 'mount' || t.toId === 'mount')).toBe(false);
  });

  it('dismissing stops offering the current techniques, but not ones that go missing later', async () => {
    const { core, storage, clock } = testCore();
    await core.items.deleteItem('transition', 'triangle-choke');
    clock.now = 7000;

    expect(await core.items.dismissMissingStarterTechniques()).toBe(1);
    expect(await storage.starterDismissals.get('triangle-choke')).toEqual({ id: 'triangle-choke', dismissedAt: 7000 });
    expect(await core.queries.missingStarterTechniques()).toEqual([]);
    expect(await core.items.addMissingStarterTechniques()).toBe(0);
    expect(await storage.transitions.get('triangle-choke')).toBeUndefined();

    await core.items.deleteItem('transition', 'kimura-guard');
    expect((await core.queries.missingStarterTechniques()).map((t) => t.id)).toEqual(['kimura-guard']);
  });
});
