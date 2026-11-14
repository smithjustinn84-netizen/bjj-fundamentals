import type { CoreEnv } from '../core';
import type { VideoBookmark } from '../models';

export type VideoInput = Omit<VideoBookmark, 'id' | 'createdAt'>;

export function createVideoService({ storage, newId, now }: CoreEnv) {
  return {
    async add(input: VideoInput): Promise<string> {
      const id = newId();
      await storage.videos.put({ ...input, id, createdAt: now() });
      return id;
    },
    remove: (id: string) => storage.videos.remove(id),
  };
}
