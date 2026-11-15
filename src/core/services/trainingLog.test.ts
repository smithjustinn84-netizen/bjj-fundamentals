import { describe, expect, it } from 'vitest';
import { testCore } from '../testing/testCore';
import type { TrainingEntryInput } from './trainingLog';

const input: TrainingEntryInput = {
  day: '2026-11-14',
  minutes: 90,
  taught: 'Scissor sweep',
  worked: '',
  struggled: '',
  focus: '',
  techniqueIds: [],
  stuckIds: [],
};

describe('writing up a class', () => {
  it('tidies what was typed and keeps only techniques that exist, once each', async () => {
    const { core, storage } = testCore();
    const id = await core.trainingLog.save(null, {
      ...input,
      minutes: 59.6,
      focus: '  Get to my side  ',
      techniqueIds: ['scissor-sweep', 'not-a-technique', 'scissor-sweep'],
      stuckIds: ['mount:bottom', 'no-such-position:bottom', 'mount', 'mount:bottom'],
    });
    expect(await storage.trainingLog.get(id)).toMatchObject({
      minutes: 60,
      focus: 'Get to my side',
      techniqueIds: ['scissor-sweep'],
      stuckIds: ['mount:bottom'],
    });
    const negative = await core.trainingLog.save(null, { ...input, minutes: -5 });
    expect((await storage.trainingLog.get(negative))?.minutes).toBe(0);
  });

  it('keeps the creation time when an entry is edited', async () => {
    const { core, storage, clock } = testCore();
    const id = await core.trainingLog.save(null, input);
    const created = clock.now;
    clock.now += 1000;
    await core.trainingLog.save(id, { ...input, taught: 'Hip bump sweep' });
    expect(await storage.trainingLog.get(id)).toMatchObject({
      taught: 'Hip bump sweep',
      createdAt: created,
      updatedAt: created + 1000,
    });
    expect(await storage.trainingLog.count()).toBe(1);
  });

  it('refuses a day that is not a calendar day', async () => {
    const { core, storage } = testCore();
    await expect(core.trainingLog.save(null, { ...input, day: 'yesterday' })).rejects.toThrow(/not a day/);
    expect(await storage.trainingLog.count()).toBe(0);
  });

  it('lists the most recent class first and removes an entry', async () => {
    const { core } = testCore();
    const older = await core.trainingLog.save(null, { ...input, day: '2026-11-01' });
    const newer = await core.trainingLog.save(null, { ...input, day: '2026-11-14' });
    expect((await core.queries.trainingLog()).map((entry) => entry.id)).toEqual([newer, older]);
    await core.trainingLog.remove(older);
    expect((await core.queries.trainingLog()).map((entry) => entry.id)).toEqual([newer]);
  });
});

describe('deleting what a class mentions', () => {
  it('keeps the entry and drops a deleted technique, or every technique of a deleted position', async () => {
    const { core, storage } = testCore();
    const id = await core.trainingLog.save(null, {
      ...input,
      techniqueIds: ['scissor-sweep', 'upa-escape', 'elbow-knee-escape', 'rear-naked-choke'],
      stuckIds: ['mount:bottom', 'half-guard:bottom'],
    });
    await core.items.deleteItem('transition', 'scissor-sweep');
    expect((await storage.trainingLog.get(id))?.techniqueIds).toEqual([
      'upa-escape',
      'elbow-knee-escape',
      'rear-naked-choke',
    ]);
    await core.items.deleteItem('position', 'mount');
    expect((await storage.trainingLog.get(id))?.techniqueIds).toEqual(['rear-naked-choke']);
    expect((await storage.trainingLog.get(id))?.stuckIds).toEqual(['half-guard:bottom']);
  });
});
