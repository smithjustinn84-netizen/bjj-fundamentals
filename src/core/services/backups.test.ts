import { describe, expect, it } from 'vitest';
import { validateBackup } from '../backup';
import { testCore } from '../testing/testCore';

describe('starter content', () => {
  it('has every transition pointing at real positions', async () => {
    const { storage } = testCore();
    expect(await storage.concepts.count()).toBeGreaterThan(5);
    const positionIds = new Set((await storage.positions.all()).map((p) => p.id));
    expect(positionIds.size).toBeGreaterThan(5);
    for (const t of await storage.transitions.all()) {
      expect(positionIds.has(t.fromId)).toBe(true);
      if (t.type !== 'submission') expect(positionIds.has(t.toId)).toBe(true);
    }
  });

  it('has a video bookmark for every starter concept, position, and transition', async () => {
    const { storage } = testCore();
    const videos = await storage.videos.all();
    for (const c of await storage.concepts.all()) {
      expect(videos.some((v) => v.linkedKind === 'concept' && v.linkedId === c.id)).toBe(true);
    }
    for (const p of await storage.positions.all()) {
      expect(videos.some((v) => v.linkedKind === 'position' && v.linkedId === p.id)).toBe(true);
    }
    for (const t of await storage.transitions.all()) {
      expect(videos.some((v) => v.linkedKind === 'transition' && v.linkedId === t.id)).toBe(true);
    }
  });

  it('passes backup validation, so a fresh export can always be re-imported', async () => {
    const exported = await testCore().core.backups.exportBackup();
    expect(() => validateBackup(JSON.parse(JSON.stringify(exported)))).not.toThrow();
  });
});

describe('backup round trip', () => {
  it('export, wipe, import restores everything through JSON', async () => {
    const { core, storage } = testCore();
    await core.videos.add({
      title: 'Scissor sweep',
      youtubeId: 'dQw4w9WgXcQ',
      startSeconds: 95,
      linkedKind: 'transition',
      linkedId: 'scissor-sweep',
      note: '',
    });
    await core.reviews.recordReview({ kind: 'concept', id: 'base' }, 'good');
    const before = await core.backups.tableCounts();

    const json = JSON.stringify(await core.backups.exportBackup());

    await storage.videos.clear();
    await core.reviews.resetProgress();
    await core.items.deleteItem('position', 'mount');

    await core.backups.importBackup(validateBackup(JSON.parse(json)));

    expect(await core.backups.tableCounts()).toEqual(before);
    expect((await storage.reviews.get('concept:base'))?.intervalDays).toBe(1);
    expect(await storage.positions.get('mount')).toBeDefined();
  });

  it('import removes rows that are not in the backup', async () => {
    const { core, storage } = testCore();
    const backup = await core.backups.exportBackup();
    const addedLater = await core.items.saveConcept(null, {
      name: 'Later',
      summary: '',
      keyPoints: [],
      drill: '',
      order: 50,
      notes: '',
    });

    await core.backups.importBackup(backup);

    expect(await storage.concepts.get(addedLater)).toBeUndefined();
  });

  it('leaves everything untouched when an import fails part-way', async () => {
    const { core, storage } = testCore();
    const before = await core.backups.tableCounts();
    const backup = await core.backups.exportBackup();
    // Make the last write of the import fail, after every earlier table has already been replaced.
    storage.reviewLog.putMany = async () => {
      throw new Error('disk full');
    };

    await expect(core.backups.importBackup({ ...backup, data: { ...backup.data, positions: [] } })).rejects.toThrow(
      'disk full',
    );

    expect(await core.backups.tableCounts()).toEqual(before);
  });

  it('eraseAll returns to the starter content', async () => {
    const { core, storage } = testCore();
    const before = await core.backups.tableCounts();
    await core.items.deleteItem('position', 'mount');
    await core.reviews.recordReview({ kind: 'concept', id: 'base' }, 'good');

    await core.backups.eraseAll();

    expect(await core.backups.tableCounts()).toEqual(before);
    expect(await storage.positions.get('mount')).toBeDefined();
  });
});
