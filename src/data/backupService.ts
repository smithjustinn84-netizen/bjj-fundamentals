import {
  BACKUP_APP,
  BACKUP_SCHEMA_VERSION,
  BACKUP_TABLES,
  type BackupData,
  type BackupFile,
  type BackupTable,
} from '../domain/backup';
import type { BjjDB } from './db';

export function createBackupService(db: BjjDB) {
  const tables = () => BACKUP_TABLES.map((name) => db.table(name));

  return {
    async exportBackup(now = Date.now()): Promise<BackupFile> {
      const data = await db.transaction('r', tables(), async () => {
        const entries = await Promise.all(BACKUP_TABLES.map(async (name) => [name, await db.table(name).toArray()]));
        // Safe: the keys are exactly BACKUP_TABLES and each table stores its own row type.
        return Object.fromEntries(entries) as BackupData;
      });
      return { app: BACKUP_APP, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: now, data };
    },

    /** Replace everything with the backup. One transaction, so a failure leaves the old data intact. */
    async importBackup(backup: BackupFile): Promise<void> {
      await db.transaction('rw', tables(), async () => {
        for (const name of BACKUP_TABLES) {
          await db.table(name).clear();
          await db.table(name).bulkPut(backup.data[name]);
        }
      });
    },

    async tableCounts(): Promise<Record<BackupTable, number>> {
      const entries = await Promise.all(BACKUP_TABLES.map(async (name) => [name, await db.table(name).count()]));
      return Object.fromEntries(entries) as Record<BackupTable, number>;
    },

    /** Delete the whole database. The starter content is re-created the next time it is opened. */
    async eraseAll(): Promise<void> {
      db.close();
      await db.delete();
    },
  };
}
