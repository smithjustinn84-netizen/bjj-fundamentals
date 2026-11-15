import { describe, expect, it } from 'vitest';
import { BACKUP_APP, BACKUP_SCHEMA_VERSION, BackupError, backupFilename, validateBackup } from './backup';
import { concept, position, trainingEntry, transition } from './testing/testFixtures';

function file(data: Record<string, unknown>) {
  return { app: BACKUP_APP, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: 123, data };
}

const validVideo = {
  id: 'v1',
  title: 'Clip',
  youtubeId: 'dQw4w9WgXcQ',
  startSeconds: 95,
  linkedKind: 'position',
  linkedId: 'p1',
  note: '',
  createdAt: 1,
};

describe('validateBackup', () => {
  it('accepts a technique with or without a role, and rejects a role that is not one', () => {
    const backupOf = (row: object) => file({ transitions: [row] });
    expect(validateBackup(backupOf(transition({ role: 'bottom' }))).data.transitions[0]?.role).toBe('bottom');
    expect(validateBackup(backupOf(transition())).data.transitions[0]?.role).toBeUndefined();
    expect(() => validateBackup(backupOf({ ...transition(), role: 'sideways' }))).toThrow(
      /"role" is missing or invalid/,
    );
  });

  it('accepts training log entries, treats a backup without the table as an empty log, and checks the day', () => {
    expect(validateBackup(file({ trainingLog: [trainingEntry()] })).data.trainingLog).toHaveLength(1);
    expect(validateBackup(file({})).data.trainingLog).toEqual([]);
    expect(() => validateBackup(file({ trainingLog: [trainingEntry({ day: 'yesterday' })] }))).toThrow(
      /"day" is missing or invalid/,
    );
    expect(() => validateBackup(file({ trainingLog: [trainingEntry({ minutes: -1 })] }))).toThrow(/"minutes"/);
  });

  it('accepts a complete backup and returns its rows', () => {
    const backup = validateBackup(
      file({
        concepts: [concept()],
        positions: [position()],
        transitions: [transition()],
        videos: [validVideo],
        reviews: [],
        reviewLog: [{ cardId: 'concept:c1', grade: 'good', reviewedAt: 5 }],
        starterDismissals: [{ id: 'scissor-sweep', dismissedAt: 9 }],
      }),
    );
    expect(backup.exportedAt).toBe(123);
    expect(backup.data.positions).toHaveLength(1);
    expect(backup.data.reviewLog[0]?.grade).toBe('good');
    expect(backup.data.starterDismissals).toEqual([{ id: 'scissor-sweep', dismissedAt: 9 }]);
  });

  it('accepts techniques with or without the blue belt flag, which older backups lack', () => {
    const backup = validateBackup(file({ transitions: [transition(), transition({ id: 't2', blueBeltTest: true })] }));
    expect(backup.data.transitions.map((t) => t.blueBeltTest)).toEqual([undefined, true]);
  });

  it('treats missing tables as empty', () => {
    const backup = validateBackup(file({ concepts: [concept()] }));
    expect(backup.data.videos).toEqual([]);
    expect(backup.data.reviewLog).toEqual([]);
    // Schema 1 and 2 backups predate starter dismissals.
    expect(backup.data.starterDismissals).toEqual([]);
  });

  it.each([
    ['not an object', 'nope', /not a JSON object/],
    ['another app', { app: 'other', schemaVersion: 1, data: {} }, /not a BJJ Fundamentals backup/],
    ['no schema version', { app: BACKUP_APP, data: {} }, /schema version/],
    ['a newer schema', { app: BACKUP_APP, schemaVersion: 99, data: {} }, /newer version/],
    ['no data', { app: BACKUP_APP, schemaVersion: 1 }, /no data section/],
    ['a table that is not a list', file({ positions: {} }), /"positions" should be a list/],
    ['a row that is not an object', file({ concepts: ['x'] }), /"concepts" entry 1 is not an object/],
    ['a missing id', file({ positions: [{ ...position(), id: '' }] }), /"positions" entry 1: "id"/],
    ['a missing list field', file({ concepts: [{ ...concept(), keyPoints: undefined }] }), /"keyPoints"/],
    ['a list with non-strings', file({ transitions: [{ ...transition(), steps: [1] }] }), /"steps"/],
    [
      'a belt test flag that is not true or false',
      file({ transitions: [{ ...transition(), blueBeltTest: 'yes' }] }),
      /"blueBeltTest"/,
    ],
    ['an unknown category', file({ positions: [{ ...position(), category: 'flying' }] }), /"category"/],
    ['a non-YouTube id', file({ videos: [{ ...validVideo, youtubeId: 'javascript:1' }] }), /"youtubeId"/],
    ['a negative start time', file({ videos: [{ ...validVideo, startSeconds: -1 }] }), /"startSeconds"/],
    ['a dismissal without a time', file({ starterDismissals: [{ id: 'scissor-sweep' }] }), /"dismissedAt"/],
    ['an unknown grade', file({ reviewLog: [{ cardId: 'a', grade: 'meh', reviewedAt: 1 }] }), /"grade"/],
    ['a non-finite number', file({ concepts: [{ ...concept(), order: Number.NaN }] }), /"order"/],
  ])('rejects %s', (_name, input, message) => {
    expect(() => validateBackup(input)).toThrow(BackupError);
    expect(() => validateBackup(input)).toThrow(message);
  });

  it('reports the position of the bad row', () => {
    const input = file({ concepts: [concept({ id: 'a' }), { ...concept({ id: 'b' }), name: 7 }] });
    expect(() => validateBackup(input)).toThrow(/entry 2: "name"/);
  });
});

describe('backupFilename', () => {
  it('uses the local date, zero-padded', () => {
    expect(backupFilename(new Date(2026, 0, 5))).toBe('bjj-fundamentals-backup-2026-01-05.json');
  });
});
