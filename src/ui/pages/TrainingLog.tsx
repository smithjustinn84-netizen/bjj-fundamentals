import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainingLog, useLibrary, useTrainingLog } from '../../bindings';
import type { Library } from '../../core/library';
import type { TrainingEntry } from '../../core/models';
import { localDayKey } from '../../core/srs';
import { formatClassCount, formatMatTime, trainingSummary } from '../../core/trainingLog';
import { Loading } from '../components/common';
import { EmptyState } from '../graphics/EmptyState';
import { itemPath } from '../routes';
import { Field } from './editor/shared';

/** What a new entry starts with: most classes run about an hour. */
const DEFAULT_CLASS_MINUTES = 60;
/** The minutes field moves in steps of this size. */
const MINUTES_STEP = 5;
const FORM_ID = 'log-form';

/** A day key shown the way the reader's locale writes dates, e.g. "Sat 14 Nov 2026". */
function formatDay(day: string): string {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function EntryForm({ lib, entry, onDone }: { lib: Library; entry: TrainingEntry | undefined; onDone: () => void }) {
  const [day, setDay] = useState(entry?.day ?? localDayKey(Date.now()));
  const [minutes, setMinutes] = useState(String(entry?.minutes ?? DEFAULT_CLASS_MINUTES));
  const [taught, setTaught] = useState(entry?.taught ?? '');
  const [worked, setWorked] = useState(entry?.worked ?? '');
  const [struggled, setStruggled] = useState(entry?.struggled ?? '');
  const [focus, setFocus] = useState(entry?.focus ?? '');
  const [techniqueIds, setTechniqueIds] = useState<string[]>(entry?.techniqueIds ?? []);

  function toggleTechnique(id: string, picked: boolean) {
    setTechniqueIds((ids) => (picked ? [...ids, id] : ids.filter((other) => other !== id)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await trainingLog.save(entry?.id ?? null, {
      day,
      minutes: Number(minutes),
      taught,
      worked,
      struggled,
      focus,
      techniqueIds,
    });
    onDone();
  }

  const groups = lib.positions
    .map((position) => ({ position, techniques: lib.transitions.filter((t) => t.fromId === position.id) }))
    .filter((group) => group.techniques.length > 0);

  return (
    <form id={FORM_ID} className="log-form" onSubmit={submit}>
      <div className="row">
        <Field label="Day" className="grow">
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
        </Field>
        <Field label="Minutes on the mat" className="grow">
          <input
            type="number"
            min={0}
            step={MINUTES_STEP}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            inputMode="numeric"
            required
          />
        </Field>
      </div>
      <Field label="What was taught">
        <textarea rows={2} value={taught} onChange={(e) => setTaught(e.target.value)} />
      </Field>
      <Field label="What worked in rolling">
        <textarea rows={2} value={worked} onChange={(e) => setWorked(e.target.value)} />
      </Field>
      <Field label="Where I got stuck">
        <textarea rows={2} value={struggled} onChange={(e) => setStruggled(e.target.value)} />
      </Field>
      <Field label="One thing to work on next time" hint="Shown on the home page until your next entry sets a new one.">
        <input value={focus} onChange={(e) => setFocus(e.target.value)} />
      </Field>
      {groups.length > 0 && (
        <details className="technique-picker">
          <summary>Techniques practised ({techniqueIds.length})</summary>
          <div className="technique-groups">
            {groups.map(({ position, techniques }) => (
              <fieldset key={position.id}>
                <legend>{position.name}</legend>
                {techniques.map((technique) => (
                  <label key={technique.id} className="check">
                    <input
                      type="checkbox"
                      checked={techniqueIds.includes(technique.id)}
                      onChange={(e) => toggleTechnique(technique.id, e.target.checked)}
                    />
                    {technique.name}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        </details>
      )}
      <div className="row">
        <button type="submit" className="primary">
          {entry ? 'Save changes' : 'Save entry'}
        </button>
        {entry && (
          <button type="button" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function EntryRow({ lib, entry, onEdit }: { lib: Library; entry: TrainingEntry; onEdit: () => void }) {
  function remove() {
    if (confirm(`Delete the entry for ${formatDay(entry.day)}?`)) void trainingLog.remove(entry.id);
  }
  const techniques = entry.techniqueIds.map((id) => lib.transitionById.get(id)).filter((t) => t !== undefined);
  const notes = [
    { label: 'Taught', text: entry.taught },
    { label: 'Worked', text: entry.worked },
    { label: 'Got stuck', text: entry.struggled },
    { label: 'Next time', text: entry.focus },
  ].filter((note) => note.text !== '');

  return (
    <li className="log-entry">
      <h3>{formatDay(entry.day)}</h3>
      <p className="muted small">{formatMatTime(entry.minutes)} on the mat</p>
      {notes.map((note) => (
        <p key={note.label}>
          <strong>{note.label}:</strong> {note.text}
        </p>
      ))}
      {techniques.length > 0 && (
        <ul className="chip-list">
          {techniques.map((technique) => (
            <li key={technique.id}>
              <Link className="chip" to={itemPath('transition', technique.id)}>
                {technique.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="row">
        <button type="button" className="link small" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="link danger small" onClick={remove}>
          Delete
        </button>
      </div>
    </li>
  );
}

export default function TrainingLog() {
  const lib = useLibrary();
  const entries = useTrainingLog();
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Bumped after each save so the form remounts empty for the next entry. */
  const [formRound, setFormRound] = useState(0);
  if (!lib || !entries) return <Loading />;

  const editing = entries.find((entry) => entry.id === editingId);
  const summary = trainingSummary(entries);

  function startEditing(id: string) {
    setEditingId(id);
    document.getElementById(FORM_ID)?.scrollIntoView({ block: 'start' });
  }

  function finishForm() {
    setEditingId(null);
    setFormRound((round) => round + 1);
  }

  return (
    <div className="stack narrow-page">
      <div>
        <h1>Training log</h1>
        <p className="muted">
          Write up each class while it is fresh. The one thing you pick to work on next time shows on the home page.
        </p>
      </div>
      <div className="card">
        <h2>{editing ? `Edit ${formatDay(editing.day)}` : 'Log a class'}</h2>
        <EntryForm key={`${editing?.id ?? 'new'}:${formRound}`} lib={lib} entry={editing} onDone={finishForm} />
      </div>
      <div className="card">
        <div className="section-head">
          <h2>Classes</h2>
          {summary.classes > 0 && (
            <span className="muted small">
              {formatClassCount(summary.classes)} · {formatMatTime(summary.minutes)}
            </span>
          )}
        </div>
        {entries.length === 0 ? (
          <EmptyState icon="log" title="No classes logged yet">
            Your first entry will show here. A sentence or two is enough.
          </EmptyState>
        ) : (
          <ul className="log-list">
            {entries.map((entry) => (
              <EntryRow key={entry.id} lib={lib} entry={entry} onEdit={() => startEditing(entry.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
