import type { CoreEnv } from '../core';
import type { TrainingEntry } from '../models';
import { situationPositionId, situationRole } from '../situations';
import { isDayKey } from '../trainingLog';

export type TrainingEntryInput = Omit<TrainingEntry, 'id' | 'createdAt' | 'updatedAt' | 'stuckIds'> & {
  stuckIds: string[];
};

/** Writing up classes: what was taught, how rolling went, and what to work on next. */
export function createTrainingLogService({ storage, newId, now }: CoreEnv) {
  return {
    /**
     * Create the entry when `id` is null, otherwise replace it keeping its creation time. Resolves to its id.
     * Text is trimmed, minutes become a whole number of at least zero, and only techniques that exist and
     * situations whose position exists are kept.
     */
    save(id: string | null, input: TrainingEntryInput): Promise<string> {
      if (!isDayKey(input.day)) return Promise.reject(new Error(`"${input.day}" is not a day like 2026-11-14.`));
      const timestamp = now();
      const entryId = id ?? newId();
      return storage.transaction(async () => {
        const existing = id ? await storage.trainingLog.get(id) : undefined;
        const known = new Set((await storage.transitions.all()).map((technique) => technique.id));
        const positions = new Set((await storage.positions.all()).map((position) => position.id));
        await storage.trainingLog.put({
          id: entryId,
          day: input.day,
          minutes: Number.isFinite(input.minutes) ? Math.max(0, Math.round(input.minutes)) : 0,
          taught: input.taught.trim(),
          worked: input.worked.trim(),
          struggled: input.struggled.trim(),
          focus: input.focus.trim(),
          techniqueIds: [...new Set(input.techniqueIds)].filter((techniqueId) => known.has(techniqueId)),
          stuckIds: [...new Set(input.stuckIds)].filter(
            (stuckId) => situationRole(stuckId) !== undefined && positions.has(situationPositionId(stuckId)),
          ),
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        });
        return entryId;
      });
    },

    remove: (id: string) => storage.trainingLog.remove(id),
  };
}
