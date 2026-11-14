import {
  BACKUP_APP,
  BACKUP_SCHEMA_VERSION,
  BACKUP_TABLES,
  type BackupData,
  type BackupFile,
  type BackupTable,
} from '../backup';
import type { CoreEnv } from '../core';

export function createBackupService({ storage, now }: CoreEnv) {
  return {
    async exportBackup(): Promise<BackupFile> {
      // Read inside a transaction so the tables are consistent with each other.
      const data: BackupData = await storage.transaction(async () => ({
        concepts: await storage.concepts.all(),
        positions: await storage.positions.all(),
        transitions: await storage.transitions.all(),
        videos: await storage.videos.all(),
        reviews: await storage.reviews.all(),
        reviewLog: await storage.reviewLog.all(),
      }));
      return { app: BACKUP_APP, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: now(), data };
    },

    /** Replace everything with the backup. One transaction, so a failure leaves the old data intact. */
    importBackup(backup: BackupFile): Promise<void> {
      const { data } = backup;
      return storage.transaction(async () => {
        await storage.concepts.clear();
        await storage.concepts.putMany(data.concepts);
        await storage.positions.clear();
        await storage.positions.putMany(data.positions);
        await storage.transitions.clear();
        await storage.transitions.putMany(data.transitions);
        await storage.videos.clear();
        await storage.videos.putMany(data.videos);
        await storage.reviews.clear();
        await storage.reviews.putMany(data.reviews);
        await storage.reviewLog.clear();
        await storage.reviewLog.putMany(data.reviewLog);
      });
    },

    async tableCounts(): Promise<Record<BackupTable, number>> {
      const counts = await Promise.all(BACKUP_TABLES.map((table) => storage[table].count()));
      // Safe: one count per entry of BACKUP_TABLES, in the same order.
      return Object.fromEntries(BACKUP_TABLES.map((table, i) => [table, counts[i]])) as Record<BackupTable, number>;
    },

    /** Delete everything and go back to the starter content. */
    eraseAll: () => storage.reset(),
  };
}
