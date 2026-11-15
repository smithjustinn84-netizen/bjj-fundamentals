import type { CoreEnv } from '../core';
import { buildLibrary, type Library } from '../library';
import type { ItemKind, Transition, VideoBookmark } from '../models';
import { starterContent } from '../seed';
import { DAY_MS, streakDays } from '../srs';
import { findMissingStarterTechniques } from '../starter';

/** How far back to look when computing the streak. Streaks longer than this are capped. */
const STREAK_WINDOW_DAYS = 400;

export interface StudyStats {
  dueCount: number;
  streakDays: number;
}

/** Read-only views of the stored data, shaped for display. */
export function createQueries({ storage, now }: CoreEnv) {
  async function dueCount(): Promise<number> {
    const timestamp = now();
    return (await storage.reviews.all()).filter((review) => review.due <= timestamp).length;
  }

  return {
    async library(): Promise<Library> {
      const [concepts, positions, transitions, reviews] = await Promise.all([
        storage.concepts.all(),
        storage.positions.all(),
        storage.transitions.all(),
        storage.reviews.all(),
      ]);
      return buildLibrary(concepts, positions, transitions, reviews);
    },

    dueCount,

    async studyStats(): Promise<StudyStats> {
      const timestamp = now();
      const [due, recent] = await Promise.all([
        dueCount(),
        storage.reviewLog.since(timestamp - STREAK_WINDOW_DAYS * DAY_MS),
      ]);
      return {
        dueCount: due,
        streakDays: streakDays(
          recent.map((entry) => entry.reviewedAt),
          timestamp,
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

    /** Newest first. */
    async videos(): Promise<VideoBookmark[]> {
      return (await storage.videos.all()).sort((a, b) => b.createdAt - a.createdAt);
    },

    /** Oldest first, for one item. */
    async linkedVideos(kind: ItemKind, id: string): Promise<VideoBookmark[]> {
      return (await storage.videos.all())
        .filter((video) => video.linkedKind === kind && video.linkedId === id)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
  };
}
