import { type ChangeEvent, useRef, useState } from 'react';
import { backups, reviews, useTableCounts } from '../../bindings';
import { BACKUP_TABLES, BackupError, backupFilename, validateBackup } from '../../core/backup';
import { TABLE_LABELS } from '../../core/labels';
import { downloadJson } from '../download';

type Message = { kind: 'ok' | 'error'; text: string };

function parseBackupText(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('That file is not valid JSON.');
  }
  return validateBackup(parsed);
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default function Backup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const counts = useTableCounts();

  async function onExport() {
    try {
      downloadJson(backupFilename(new Date()), await backups.exportBackup());
      setMessage({
        kind: 'ok',
        text: 'Backup downloaded. Keep it somewhere safe, like cloud storage or email to yourself.',
      });
    } catch (error) {
      setMessage({ kind: 'error', text: `Export failed: ${errorText(error)}` });
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    try {
      const backup = parseBackupText(await file.text());
      const when = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString() : 'an unknown date';
      const summary = BACKUP_TABLES.map((t) => `${TABLE_LABELS[t]}: ${backup.data[t].length}`).join('\n');
      const confirmed = confirm(
        `Replace ALL current data with this backup from ${when}?\n\n${summary}\n\nThis cannot be undone. Export first if you want to keep what you have now.`,
      );
      if (!confirmed) return;
      await backups.importBackup(backup);
      setMessage({ kind: 'ok', text: `Restored backup from ${when}.` });
    } catch (error) {
      const text =
        error instanceof BackupError
          ? `${error.message} Nothing was changed.`
          : `Import failed, nothing was changed: ${errorText(error)}`;
      setMessage({ kind: 'error', text });
    }
  }

  async function resetProgress() {
    if (!confirm('Reset all review progress? Your positions, techniques, concepts and videos are kept.')) return;
    await reviews.resetProgress();
    setMessage({ kind: 'ok', text: 'Review progress reset.' });
  }

  async function eraseAll() {
    const confirmed = confirm(
      'Erase EVERYTHING and start over with the starter content? Your notes, videos, edits and progress will be deleted. This cannot be undone.',
    );
    if (!confirmed) return;
    await backups.eraseAll();
    setMessage({ kind: 'ok', text: 'Everything erased. You are back to the starter content.' });
  }

  return (
    <div className="stack narrow-page">
      <div>
        <h1>Backup</h1>
        <p className="muted">
          Your data lives only in this browser, on this device. Clearing site data or switching browsers loses it, so
          export a backup now and then.
        </p>
      </div>

      {message && (
        <p className={message.kind === 'ok' ? 'notice' : 'error'} role="status">
          {message.text}
        </p>
      )}

      <div className="card stack">
        <h2>Export</h2>
        <p>
          Download everything — concepts, positions, techniques, video bookmarks, and review progress — as one JSON
          file.
        </p>
        <button type="button" className="primary" onClick={onExport}>
          Export backup
        </button>
      </div>

      <div className="card stack">
        <h2>Import</h2>
        <p>Restore from a backup file. This replaces everything currently stored.</p>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} hidden />
        <button type="button" onClick={() => fileRef.current?.click()}>
          Import backup…
        </button>
      </div>

      {counts && (
        <div className="card">
          <h2>What's stored</h2>
          <table className="counts">
            <tbody>
              {BACKUP_TABLES.map((t) => (
                <tr key={t}>
                  <td>{TABLE_LABELS[t]}</td>
                  <td>{counts[t]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card stack danger-zone">
        <h2>Start over</h2>
        <div className="row">
          <button type="button" onClick={resetProgress}>
            Reset review progress
          </button>
          <button type="button" className="danger" onClick={eraseAll}>
            Erase everything
          </button>
        </div>
      </div>
    </div>
  );
}
