import {
  type Concept,
  GRADES,
  ITEM_KINDS,
  POSITION_CATEGORIES,
  type Position,
  type ReviewLogEntry,
  type ReviewState,
  TRANSITION_TYPES,
  type Transition,
  type VideoBookmark,
} from './models';
import { localDayKey } from './srs';
import { isYouTubeId } from './youtube';

/**
 * The backup file format. A backup is untrusted input (the user can pick any file),
 * so `validateBackup` checks every field before anything is written to the database.
 */

export const BACKUP_APP = 'bjj-fundamentals';
/** Bump when the shape of any table changes, and teach `validateBackup` to accept the older shape. */
export const BACKUP_SCHEMA_VERSION = 2;

export interface BackupData {
  positions: Position[];
  transitions: Transition[];
  concepts: Concept[];
  videos: VideoBookmark[];
  reviews: ReviewState[];
  reviewLog: ReviewLogEntry[];
}

export type BackupTable = keyof BackupData;
export const BACKUP_TABLES = [
  'positions',
  'transitions',
  'concepts',
  'videos',
  'reviews',
  'reviewLog',
] as const satisfies readonly BackupTable[];

export interface BackupFile {
  app: typeof BACKUP_APP;
  schemaVersion: number;
  exportedAt: number;
  data: BackupData;
}

export class BackupError extends Error {}

type Check = (value: unknown) => boolean;
/** One check per field. Mapped over the entity type so a new field cannot be added without a check. */
type Schema<T> = { [K in keyof T]-?: Check };

const text: Check = (v) => typeof v === 'string';
const id: Check = (v) => typeof v === 'string' && v !== '';
/** A type guard as well as a `Check`, so callers that go on to use the number need no cast. */
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const bool: Check = (v) => typeof v === 'boolean';
const textList: Check = (v) => Array.isArray(v) && v.every(text);
const oneOf =
  (allowed: readonly string[]): Check =>
  (v) =>
    typeof v === 'string' && allowed.includes(v);
const optional =
  (check: Check): Check =>
  (v) =>
    v === undefined || check(v);

const SCHEMAS: { [T in BackupTable]: Schema<BackupData[T][number]> } = {
  positions: {
    id,
    name: text,
    category: oneOf(POSITION_CATEGORIES),
    summary: text,
    topGoals: textList,
    bottomGoals: textList,
    conceptIds: textList,
    order: num,
    notes: text,
    createdAt: num,
    updatedAt: num,
  },
  transitions: {
    id,
    name: text,
    type: oneOf(TRANSITION_TYPES),
    fromId: text,
    toId: text,
    steps: textList,
    commonMistakes: textList,
    // Absent in schema 1 backups, which predate the blue belt list.
    blueBeltTest: optional(bool),
    notes: text,
    createdAt: num,
    updatedAt: num,
  },
  concepts: {
    id,
    name: text,
    summary: text,
    keyPoints: textList,
    drill: text,
    order: num,
    notes: text,
    createdAt: num,
    updatedAt: num,
  },
  videos: {
    id,
    title: text,
    youtubeId: (v) => typeof v === 'string' && isYouTubeId(v),
    startSeconds: (v) => num(v) && v >= 0,
    linkedKind: oneOf(['', ...ITEM_KINDS]),
    linkedId: text,
    note: text,
    createdAt: num,
  },
  reviews: {
    id,
    kind: oneOf(ITEM_KINDS),
    itemId: id,
    ease: num,
    intervalDays: num,
    repetitions: num,
    lapses: num,
    due: num,
    lastReviewed: num,
  },
  reviewLog: {
    id: optional(num),
    cardId: id,
    grade: oneOf(GRADES),
    reviewedAt: num,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRows(table: BackupTable, rows: unknown): unknown[] {
  // A missing table is treated as empty so partial backups still load.
  if (rows === undefined) return [];
  if (!Array.isArray(rows)) throw new BackupError(`"${table}" should be a list.`);
  const schema: Record<string, Check> = SCHEMAS[table];
  rows.forEach((row, index) => {
    if (!isRecord(row)) throw new BackupError(`"${table}" entry ${index + 1} is not an object.`);
    for (const [field, check] of Object.entries(schema)) {
      if (!check(row[field])) {
        throw new BackupError(`"${table}" entry ${index + 1}: "${field}" is missing or invalid.`);
      }
    }
  });
  return rows;
}

/** Check that parsed JSON is one of our backups. Returns a new object; throws BackupError with a readable message. */
export function validateBackup(value: unknown): BackupFile {
  if (!isRecord(value)) throw new BackupError('The file is not a JSON object.');
  if (value.app !== BACKUP_APP) throw new BackupError('This file is not a BJJ Fundamentals backup.');
  if (typeof value.schemaVersion !== 'number') throw new BackupError('The backup is missing its schema version.');
  if (value.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupError(`This backup was made by a newer version of the app (schema ${value.schemaVersion}).`);
  }
  const data = value.data;
  if (!isRecord(data)) throw new BackupError('The backup has no data section.');
  const validated = Object.fromEntries(BACKUP_TABLES.map((table) => [table, validateRows(table, data[table])]));
  return {
    app: BACKUP_APP,
    schemaVersion: value.schemaVersion,
    exportedAt: num(value.exportedAt) ? value.exportedAt : 0,
    // Safe: every row of every table was just checked field by field against SCHEMAS.
    data: validated as unknown as BackupData,
  };
}

export function backupFilename(now: Date): string {
  return `bjj-fundamentals-backup-${localDayKey(now.getTime())}.json`;
}
