import { describe, expect, it } from 'vitest';
import { type BackupFile, validateBackup } from '../domain/backup';
import { createBackupService } from './backupService';
import { createReviewRepository } from './reviewRepository';
import { freshDb } from './testDb';
import { createVideoRepository } from './videoRepository';

describe('starter content', () => {
  it('is created on first open, with every transition pointing at real positions', async () => {
    const db = freshDb();
    expect(await db.concepts.count()).toBeGreaterThan(5);
    const positionIds = new Set(await db.positions.toCollection().primaryKeys());
    expect(positionIds.size).toBeGreaterThan(5);
    for (const t of await db.transitions.toArray()) {
      expect(positionIds.has(t.fromId)).toBe(true);
      if (t.type !== 'submission') expect(positionIds.has(t.toId)).toBe(true);
    }
  });

  it('passes backup validation, so a fresh export can always be re-imported', async () => {
    const exported = await createBackupService(freshDb()).exportBackup();
    expect(() => validateBackup(JSON.parse(JSON.stringify(exported)))).not.toThrow();
  });
});

describe('backup round trip', () => {
  it('export, wipe, import restores everything through JSON', async () => {
    const db = freshDb();
    const backups = createBackupService(db);
    await createVideoRepository(db).add({
      title: 'Scissor sweep',
      youtubeId: 'dQw4w9WgXcQ',
      startSeconds: 95,
      linkedKind: 'transition',
      linkedId: 'scissor-sweep',
      note: '',
    });
    await createReviewRepository(db).recordReview({ kind: 'concept', id: 'base' }, 'good');
    await db.positions.update('mount', { notes: 'keep knees tight' });

    const json = JSON.stringify(await backups.exportBackup());

    await db.videos.clear();
    await db.reviews.clear();
    await db.reviewLog.clear();
    await db.positions.delete('mount');

    await backups.importBackup(validateBackup(JSON.parse(json)));

    expect(await db.videos.count()).toBe(1);
    expect((await db.reviews.get('concept:base'))?.intervalDays).toBe(1);
    expect(await db.reviewLog.count()).toBe(1);
    expect((await db.positions.get('mount'))?.notes).toBe('keep knees tight');
  });

  it('import removes rows that are not in the backup', async () => {
    const db = freshDb();
    const backups = createBackupService(db);
    const backup = await backups.exportBackup();
    await db.positions.delete('mount');
    const kept = await db.positions.get('standing');
    if (!kept) throw new Error('starter content is missing "standing"');
    await db.positions.add({ ...kept, id: 'added-later' });

    await backups.importBackup(backup);

    expect(await db.positions.get('added-later')).toBeUndefined();
    expect(await db.positions.get('mount')).toBeDefined();
  });

  it('leaves the database untouched when an import fails part-way', async () => {
    const db = freshDb();
    const backups = createBackupService(db);
    const before = await backups.tableCounts();
    const good = await backups.exportBackup();
    // An object is not a valid IndexedDB key, so writing this row fails after earlier tables were cleared.
    const corrupt = { ...good, data: { ...good.data, positions: [], videos: [{ id: {} }] } } as unknown as BackupFile;

    await expect(backups.importBackup(corrupt)).rejects.toThrow();

    expect(await backups.tableCounts()).toEqual(before);
  });
});
