import type { VideoBookmark } from '../domain/types';
import type { BjjDB } from './db';

export type VideoInput = Omit<VideoBookmark, 'id' | 'createdAt'>;

export function createVideoRepository(db: BjjDB) {
  return {
    async add(input: VideoInput, now = Date.now()): Promise<string> {
      const id = crypto.randomUUID();
      await db.videos.add({ ...input, id, createdAt: now });
      return id;
    },
    remove: (id: string) => db.videos.delete(id),
  };
}
