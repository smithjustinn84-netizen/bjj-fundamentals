import type { CoreEnv } from '../core';
import type { VideoBookmark } from '../models';

export type VideoInput = Omit<VideoBookmark, 'id' | 'createdAt'>;

/** The title a bookmark saved without one gets, so every row in a list has something to click. */
export const UNTITLED_VIDEO = 'Untitled clip';

export function createVideoService({ storage, newId, now }: CoreEnv) {
  return {
    async add(input: VideoInput): Promise<string> {
      const id = newId();
      await storage.videos.put({ ...input, title: input.title.trim() || UNTITLED_VIDEO, id, createdAt: now() });
      return id;
    },
    remove: (id: string) => storage.videos.remove(id),
  };
}
