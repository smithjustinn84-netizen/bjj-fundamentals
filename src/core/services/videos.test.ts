import { describe, expect, it } from 'vitest';
import { testCore } from '../testing/testCore';
import { UNTITLED_VIDEO } from './videos';

const input = { youtubeId: 'dQw4w9WgXcQ', startSeconds: 0, linkedKind: '' as const, linkedId: '', note: '' };

describe('adding a video bookmark', () => {
  it('keeps a trimmed title, or gives an untitled one a placeholder', async () => {
    const { core, storage } = testCore();
    const named = await core.videos.add({ ...input, title: '  Hip escape  ' });
    const blank = await core.videos.add({ ...input, title: '   ' });
    expect(await storage.videos.get(named)).toMatchObject({ title: 'Hip escape' });
    expect(await storage.videos.get(blank)).toMatchObject({ title: UNTITLED_VIDEO });
  });
});
