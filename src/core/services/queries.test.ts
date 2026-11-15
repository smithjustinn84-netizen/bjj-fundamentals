import { describe, expect, it } from 'vitest';
import { testCore } from '../testing/testCore';

const video = { title: 'Clip', youtubeId: 'dQw4w9WgXcQ', startSeconds: 0, note: '' };

describe('queries', () => {
  it('library loads every item with its review state', async () => {
    const { core } = testCore();
    await core.reviews.recordReview({ kind: 'concept', id: 'base' }, 'good');
    const lib = await core.queries.library();
    expect(lib.concepts.length).toBeGreaterThan(5);
    expect(lib.positionById.get('mount')?.name).toBe('Mount');
    expect(lib.reviews.get('concept:base')?.repetitions).toBe(1);
  });

  it('videos are newest first overall and oldest first per item', async () => {
    const { core, storage, clock } = testCore();
    await storage.videos.clear();
    const link = { linkedKind: 'position', linkedId: 'mount' } as const;
    const first = await core.videos.add({ ...video, ...link });
    clock.now += 1000;
    const unlinked = await core.videos.add({ ...video, linkedKind: '', linkedId: '' });
    clock.now += 1000;
    const last = await core.videos.add({ ...video, ...link });

    expect((await core.queries.videos()).map((v) => v.id)).toEqual([last, unlinked, first]);
    expect((await core.queries.linkedVideos('position', 'mount')).map((v) => v.id)).toEqual([first, last]);
    expect(await core.queries.linkedVideos('concept', 'mount')).toEqual([]);
  });

  it('subscribe reports changes made through the services', async () => {
    const { core } = testCore();
    let calls = 0;
    const unsubscribe = core.subscribe(() => {
      calls += 1;
    });
    await core.videos.add({ ...video, linkedKind: '', linkedId: '' });
    expect(calls).toBeGreaterThan(0);
    unsubscribe();
  });
});
