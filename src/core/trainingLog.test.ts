import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import { position, trainingEntry, transition } from './testing/testFixtures';
import {
  formatClassCount,
  formatMatTime,
  isDayKey,
  newestFirst,
  recentlyPractised,
  studyFirst,
  trainingSummary,
} from './trainingLog';

describe('isDayKey', () => {
  it('accepts a calendar day and rejects anything else', () => {
    expect(isDayKey('2026-11-14')).toBe(true);
    expect(isDayKey('2026-13-01')).toBe(false);
    expect(isDayKey('2026-11-32')).toBe(false);
    expect(isDayKey('2026-1-4')).toBe(false);
    expect(isDayKey('14/11/2026')).toBe(false);
    expect(isDayKey('')).toBe(false);
  });
});

describe('newestFirst', () => {
  it('orders by day, then by when it was written', () => {
    const entries = [
      trainingEntry({ id: 'old', day: '2026-11-01' }),
      trainingEntry({ id: 'morning', day: '2026-11-14', createdAt: 1 }),
      trainingEntry({ id: 'evening', day: '2026-11-14', createdAt: 2 }),
    ];
    expect(newestFirst(entries).map((e) => e.id)).toEqual(['evening', 'morning', 'old']);
  });
});

describe('trainingSummary', () => {
  it('totals classes and minutes and takes the focus from the latest class that set one', () => {
    const summary = trainingSummary([
      trainingEntry({ id: 'a', day: '2026-11-01', minutes: 60, focus: 'Frames first' }),
      trainingEntry({ id: 'b', day: '2026-11-08', minutes: 90, focus: 'Keep elbows in' }),
      trainingEntry({ id: 'c', day: '2026-11-14', minutes: 45, focus: '' }),
    ]);
    expect(summary).toEqual({ classes: 3, minutes: 195, focus: 'Keep elbows in', stuckIds: [] });
  });

  it('is empty for an empty log', () => {
    expect(trainingSummary([])).toEqual({ classes: 0, minutes: 0, focus: '', stuckIds: [] });
  });
});

describe('formatMatTime', () => {
  it('writes minutes, whole hours, or both', () => {
    expect(formatMatTime(45)).toBe('45 min');
    expect(formatMatTime(120)).toBe('2 h');
    expect(formatMatTime(90)).toBe('1 h 30 min');
    expect(formatMatTime(0)).toBe('0 min');
  });
});

describe('formatClassCount', () => {
  it('uses the right plural', () => {
    expect(formatClassCount(1)).toBe('1 class');
    expect(formatClassCount(3)).toBe('3 classes');
  });
});

describe('recentlyPractised', () => {
  it('lists techniques from the latest classes, most recent first, each once', () => {
    const entries = [
      trainingEntry({ id: 'a', day: '2026-11-01', techniqueIds: ['old-move'] }),
      trainingEntry({ id: 'b', day: '2026-11-08', techniqueIds: ['sweep', 'pass'] }),
      trainingEntry({ id: 'c', day: '2026-11-14', techniqueIds: ['escape', 'sweep'] }),
    ];
    expect(recentlyPractised(entries, 2)).toEqual(['escape', 'sweep', 'pass']);
    expect(recentlyPractised(entries, 0)).toEqual([]);
  });
});

describe('where the student got stuck', () => {
  const lib = buildLibrary(
    [],
    [position({ id: 'mount', category: 'top' })],
    [
      transition({ id: 'upa', name: 'A', type: 'escape', fromId: 'mount', role: 'bottom' }),
      transition({ id: 'shrimp', name: 'B', type: 'escape', fromId: 'mount', role: 'bottom' }),
      transition({ id: 'armbar', name: 'C', type: 'submission', fromId: 'mount', role: 'top' }),
    ],
    [],
  );

  it('is summarised from the latest class that named anywhere', () => {
    const entries = [
      trainingEntry({ id: 'a', day: '2026-11-01', stuckIds: ['mount:bottom'] }),
      trainingEntry({ id: 'b', day: '2026-11-08' }),
    ];
    expect(trainingSummary(entries).stuckIds).toEqual(['mount:bottom']);
  });

  it('puts the situation and its techniques before the techniques practised', () => {
    const entries = [trainingEntry({ techniqueIds: ['armbar', 'upa'], stuckIds: ['mount:bottom', 'gone:top'] })];
    expect(studyFirst(lib, entries, 3)).toEqual([
      'situation:mount:bottom',
      'transition:upa',
      'transition:shrimp',
      'transition:armbar',
    ]);
    expect(studyFirst(lib, entries, 0)).toEqual([]);
  });
});
