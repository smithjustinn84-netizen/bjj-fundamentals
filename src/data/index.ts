/**
 * The public surface of the data layer. UI code imports from here and nowhere else in `data/`,
 * so storage can change without touching a single component.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import type { BackupTable } from '../domain/backup';
import type { Library } from '../domain/library';
import type { ItemKind, VideoBookmark } from '../domain/types';
import { createBackupService } from './backupService';
import { BjjDB } from './db';
import { createItemRepository } from './itemRepository';
import { createQueries, type StudyStats } from './queries';
import { createReviewRepository } from './reviewRepository';
import { createVideoRepository } from './videoRepository';

const db = new BjjDB();
const queries = createQueries(db);

export const items = createItemRepository(db);
export const videos = createVideoRepository(db);
export const reviews = createReviewRepository(db);
export const backups = createBackupService(db);

export type { ConceptInput, PositionInput, TransitionInput } from './itemRepository';
export type { StudyStats } from './queries';
export type { VideoInput } from './videoRepository';

// Live queries: components re-render when the underlying tables change. Each returns undefined while loading.

export function useLibrary(): Library | undefined {
  return useLiveQuery(() => queries.library(), []);
}

export function useDueCount(): number {
  return useLiveQuery(() => queries.dueCount(), [], 0);
}

export function useStudyStats(): StudyStats | undefined {
  return useLiveQuery(() => queries.studyStats(), []);
}

export function useVideos(): VideoBookmark[] | undefined {
  return useLiveQuery(() => queries.videos(), []);
}

export function useLinkedVideos(kind: ItemKind, id: string): VideoBookmark[] | undefined {
  return useLiveQuery(() => queries.linkedVideos(kind, id), [kind, id]);
}

export function useTableCounts(): Record<BackupTable, number> | undefined {
  return useLiveQuery(() => backups.tableCounts(), []);
}
