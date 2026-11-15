import type { CoreEnv } from '../core';
import { buildLibrary, type Library } from '../library';
import type { Concept, ItemKind, TrainingEntry, Transition, VideoBookmark } from '../models';
import { starterContent } from '../seed';
import { DAY_MS, streakDays } from '../srs';
import { findMissingStarterConcepts, findMissingStarterTechniques } from '../starter';
import { buildQueue } from '../study';
import { newestFirst } from '../trainingLog';

/** How far back to look when computing the streak. Streaks longer than this are capped. */
const STREAK_WINDOW_DAYS = 400;

export interface StudyStats {
  dueCount: number;
  /** Days in a row with a review or a logged class. */
  streakDays: number;
}

/** Read-only views of the stored data, shaped for display. */
export function createQueries({ storage, now }: CoreEnv) {
  async function library(): Promise<Library> {
    const [concepts, positions, transitions, reviews] = await Promise.all([
      storage.concepts.all(),
      storage.positions.all(),
      storage.transitions.all(),
      storage.reviews.all(),
    ]);
    return buildLibrary(concepts, positions, transitions, reviews);
  }

  /**
   * Counted from the queue a review would show, not from the stored cards: a situation card whose side
   * has lost its last technique stays stored but can no longer be studied, and must not be counted as due.
   */
  async function dueCount(): Promise<number> {
    return buildQueue(await library(), 'all', 0, now()).due.length;
  }

  return {
    library,

    dueCount,

    async studyStats(): Promise<StudyStats> {
      const timestamp = now();
      const [due, recent, classes] = await Promise.all([
        dueCount(),
        storage.reviewLog.since(timestamp - STREAK_WINDOW_DAYS * DAY_MS),
        storage.trainingLog.all(),
      ]);
      return {
        dueCount: due,
        streakDays: streakDays(
          recent.map((entry) => entry.reviewedAt),
          timestamp,
          classes.map((entry) => entry.day),
        ),
      };
    },

    /** Starter techniques to offer this library: ones it could hold but does not, and has not dismissed. */
    async missingStarterTechniques(): Promise<Transition[]> {
      const [transitions, positions, dismissed] = await Promise.all([
        storage.transitions.all(),
        storage.positions.all(),
        storage.starterDismissals.all(),
      ]);
      return findMissingStarterTechniques(starterContent(now()).transitions, transitions, positions, dismissed);
    },

    /** Starter concepts to offer this library: ones it does not hold and has not dismissed. */
    async missingStarterConcepts(): Promise<Concept[]> {
      const [concepts, dismissed] = await Promise.all([storage.concepts.all(), storage.starterDismissals.all()]);
      return findMissingStarterConcepts(starterContent(now()).concepts, concepts, dismissed);
    },

    /** Newest first. */
    async videos(): Promise<VideoBookmark[]> {
      return (await storage.videos.all()).sort((a, b) => b.createdAt - a.createdAt);
    },

    /** Every class written up, most recent day first. */
    async trainingLog(): Promise<TrainingEntry[]> {
      return newestFirst(await storage.trainingLog.all());
    },

    /** Oldest first, for one item. */
    async linkedVideos(kind: ItemKind, id: string): Promise<VideoBookmark[]> {
      return (await storage.videos.all())
        .filter((video) => video.linkedKind === kind && video.linkedId === id)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
  };
}
