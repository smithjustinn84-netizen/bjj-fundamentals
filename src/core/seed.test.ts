import { describe, expect, it } from 'vitest';
import { endsTheRoll } from './models';
import { starterContent } from './seed';
import { isYouTubeId } from './youtube';

describe('starter content', () => {
  const starter = starterContent(0);

  it('uses each id once across concepts, positions and techniques, since dismissals are keyed by id alone', () => {
    const ids = [...starter.concepts, ...starter.positions, ...starter.transitions].map((row) => row.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('gives every starter video a unique id and a unique, valid YouTube id', () => {
    const ids = starter.videos.map((v) => v.id);
    const youtubeIds = starter.videos.map((v) => v.youtubeId);
    expect(ids.length).toBe(new Set(ids).size);
    expect(youtubeIds.length).toBe(new Set(youtubeIds).size);
    expect(starter.videos.filter((v) => !isYouTubeId(v.youtubeId)).map((v) => v.id)).toEqual([]);
  });

  it('only links positions to starter concepts', () => {
    const conceptIds = new Set(starter.concepts.map((c) => c.id));
    const unknown = starter.positions.flatMap((p) => p.conceptIds.filter((id) => !conceptIds.has(id)));
    expect(unknown).toEqual([]);
  });

  it('starts and ends every technique at a starter position, or an existing library is never offered it', () => {
    const positionIds = new Set(starter.positions.map((p) => p.id));
    const broken = starter.transitions.filter(
      (t) => !positionIds.has(t.fromId) || (!endsTheRoll(t.type) && !positionIds.has(t.toId)),
    );
    expect(broken.map((t) => t.id)).toEqual([]);
  });

  it('links every starter video to a starter item', () => {
    const itemIds = {
      concept: new Set(starter.concepts.map((c) => c.id)),
      position: new Set(starter.positions.map((p) => p.id)),
      transition: new Set(starter.transitions.map((t) => t.id)),
    };
    const unlinked = starter.videos.filter((v) => v.linkedKind === '' || !itemIds[v.linkedKind].has(v.linkedId));
    expect(unlinked.map((v) => v.id)).toEqual([]);
  });

  it('bookmarks at least two videos for every starter concept', () => {
    const counts = new Map<string, number>();
    for (const v of starter.videos) {
      if (v.linkedKind === 'concept') counts.set(v.linkedId, (counts.get(v.linkedId) ?? 0) + 1);
    }
    expect(starter.concepts.filter((c) => (counts.get(c.id) ?? 0) < 2).map((c) => c.id)).toEqual([]);
  });
});
