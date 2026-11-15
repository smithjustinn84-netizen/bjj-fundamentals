import { describe, expect, it } from 'vitest';
import { starterContent } from './seed';

describe('starter content', () => {
  const starter = starterContent(0);

  it('uses each id once across concepts, positions and techniques, since dismissals are keyed by id alone', () => {
    const ids = [...starter.concepts, ...starter.positions, ...starter.transitions].map((row) => row.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('only links positions to starter concepts', () => {
    const conceptIds = new Set(starter.concepts.map((c) => c.id));
    const unknown = starter.positions.flatMap((p) => p.conceptIds.filter((id) => !conceptIds.has(id)));
    expect(unknown).toEqual([]);
  });

  it('bookmarks a video for every starter concept', () => {
    const linked = new Set(starter.videos.filter((v) => v.linkedKind === 'concept').map((v) => v.linkedId));
    expect(starter.concepts.filter((c) => !linked.has(c.id)).map((c) => c.id)).toEqual([]);
  });
});
