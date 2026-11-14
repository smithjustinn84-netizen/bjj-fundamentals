import { describe, expect, it } from 'vitest';
import { BACKUP_APP, BACKUP_SCHEMA_VERSION, BackupError, backupFilename, validateBackup } from './backup';
import { concept, position, transition } from './testing/testFixtures';

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
  it('accepts a complete backup and returns its rows', () => {
    const backup = validateBackup(
      file({
        concepts: [concept()],
        positions: [position()],
        transitions: [transition()],
        videos: [validVideo],
        reviews: [],
        reviewLog: [{ cardId: 'concept:c1', grade: 'good', reviewedAt: 5 }],
      }),
    );
    expect(backup.exportedAt).toBe(123);
    expect(backup.data.positions).toHaveLength(1);
    expect(backup.data.reviewLog[0]?.grade).toBe('good');
  });

  it('treats missing tables as empty', () => {
    const backup = validateBackup(file({ concepts: [concept()] }));
    expect(backup.data.videos).toEqual([]);
    expect(backup.data.reviewLog).toEqual([]);
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
    ['an unknown category', file({ positions: [{ ...position(), category: 'flying' }] }), /"category"/],
    ['a non-YouTube id', file({ videos: [{ ...validVideo, youtubeId: 'javascript:1' }] }), /"youtubeId"/],
    ['a negative start time', file({ videos: [{ ...validVideo, startSeconds: -1 }] }), /"startSeconds"/],
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
