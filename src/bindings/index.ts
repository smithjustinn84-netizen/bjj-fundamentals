/**
 * The composition root: the one place that chooses a storage engine and connects the core to React.
 * To run the app on different storage, change the `storage` line below and nothing else.
 *
 * UI code imports its data and actions from here, never from `src/storage`.
 */
import { useCallback } from 'react';
import type { BackupTable } from '../core/backup';
import { createCore } from '../core/core';
import type { Library } from '../core/library';
import type { Concept, ItemKind, ThemeChoice, TrainingEntry, Transition, VideoBookmark } from '../core/models';
import { starterContent } from '../core/seed';
import type { StudyStats } from '../core/services/queries';
import { createDexieStorage } from '../storage/dexieStorage';
import { useQuery } from './useQuery';

const storage = createDexieStorage({ initialData: starterContent(Date.now()) });

const core = createCore({
  storage,
  newId: () => crypto.randomUUID(),
  now: () => Date.now(),
});

export const { items, videos, reviews, backups, trainingLog, settings } = core;
const { queries, subscribe } = core;

// Live reads: each returns undefined while loading and re-renders its component when stored data changes.

export function useLibrary(): Library | undefined {
  return useQuery(subscribe, queries.library);
}

export function useDueCount(): number {
  return useQuery(subscribe, queries.dueCount) ?? 0;
}

export function useStudyStats(): StudyStats | undefined {
  return useQuery(subscribe, queries.studyStats);
}

export function useMissingStarterTechniques(): Transition[] | undefined {
  return useQuery(subscribe, queries.missingStarterTechniques);
}

export function useMissingStarterConcepts(): Concept[] | undefined {
  return useQuery(subscribe, queries.missingStarterConcepts);
}

export function useVideos(): VideoBookmark[] | undefined {
  return useQuery(subscribe, queries.videos);
}

export function useTrainingLog(): TrainingEntry[] | undefined {
  return useQuery(subscribe, queries.trainingLog);
}

/** Undefined until the stored choice has been read. */
export function useThemeChoice(): ThemeChoice | undefined {
  return useQuery(subscribe, queries.themeChoice);
}

export function useLinkedVideos(kind: ItemKind, id: string): VideoBookmark[] | undefined {
  const read = useCallback(() => queries.linkedVideos(kind, id), [kind, id]);
  return useQuery(subscribe, read);
}

export function useTableCounts(): Record<BackupTable, number> | undefined {
  return useQuery(subscribe, backups.tableCounts);
}
