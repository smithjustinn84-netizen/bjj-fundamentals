import { type FormEvent, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainingLog, useLibrary, useTrainingLog } from '../../bindings';
import type { Library } from '../../core/library';
import type { TrainingEntry } from '../../core/models';
import { allSituations, findSituation, situationId, situationName } from '../../core/situations';
import { localDayKey } from '../../core/srs';
import {
  formatClassCount,
  formatMatTime,
  isDayKey,
  quickPicks,
  RECENT_CLASS_COUNT,
  recentlyPractised,
  recentlyStuck,
  stuckSituationIds,
  trainingSummary,
} from '../../core/trainingLog';
import { Loading } from '../components/common';
import { EmptyState } from '../graphics/EmptyState';
import { Icon } from '../graphics/icons';
import { itemPath, positionSidePath } from '../routes';
import { Field } from './editor/shared';

/** What a new entry starts with: most classes run about an hour. */
const DEFAULT_CLASS_MINUTES = 60;
/** The class lengths offered as one tap; anything else is typed in. */
const MINUTE_PRESETS = [45, 60, 90, 120];
/** The minutes field moves in steps of this size. */
const MINUTES_STEP = 5;
const FORM_ID = 'log-form';
const SAVE_FAILED = 'That did not save. Your entry is still in the form: try again.';
const DELETE_FAILED = 'That entry could not be deleted. Try again.';

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

/** A choice that is on or off, as a pill a thumb can hit. */
function ToggleChip(props: { pressed: boolean; onToggle: (pressed: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className="chip toggle-chip"
      aria-pressed={props.pressed}
      onClick={() => props.onToggle(!props.pressed)}
    >
      {props.pressed && <Icon name="check" />}
      {props.children}
    </button>
  );
}

function EntryForm(props: {
  lib: Library;
  /** Every entry so far: recent ones decide which choices are offered up front. */
  entries: TrainingEntry[];
  entry: TrainingEntry | undefined;
  onDone: () => void;
}) {
  const { lib, entries, entry, onDone } = props;
  const [day, setDay] = useState(entry?.day ?? localDayKey(Date.now()));
  const [minutes, setMinutes] = useState(String(entry?.minutes ?? DEFAULT_CLASS_MINUTES));
  /** True while the length is typed in, not picked from the presets. */
  const [otherMinutes, setOtherMinutes] = useState(() => !MINUTE_PRESETS.includes(Number(minutes)));
  const [taught, setTaught] = useState(entry?.taught ?? '');
  const [worked, setWorked] = useState(entry?.worked ?? '');
  const [struggled, setStruggled] = useState(entry?.struggled ?? '');
  const [focus, setFocus] = useState(entry?.focus ?? '');
  const [techniqueIds, setTechniqueIds] = useState<string[]>(entry?.techniqueIds ?? []);
  const [stuckIds, setStuckIds] = useState<string[]>(entry ? stuckSituationIds(entry) : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleTechnique(id: string, picked: boolean) {
    setTechniqueIds((ids) => (picked ? [...ids, id] : ids.filter((other) => other !== id)));
  }

  function toggleStuck(id: string, picked: boolean) {
    setStuckIds((ids) => (picked ? [...ids, id] : ids.filter((other) => other !== id)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    // A second click while the first save is running would write a second entry.
    if (saving) return;
    if (!isDayKey(day)) {
      setError('Choose a day with a four-digit year.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await trainingLog.save(entry?.id ?? null, {
        day,
        minutes: Number(minutes),
        taught,
        worked,
        struggled,
        focus,
        techniqueIds,
        stuckIds,
      });
    } catch {
      setSaving(false);
      setError(SAVE_FAILED);
      return;
    }
    onDone();
  }

  const situations = allSituations(lib).map((situation) => ({
    id: situationId(situation.position.id, situation.role),
    name: situationName(situation),
  }));
  const groups = lib.positions
    .map((position) => ({ position, techniques: lib.transitions.filter((t) => t.fromId === position.id) }))
    .filter((group) => group.techniques.length > 0);
  // Offered up front; `useState` keeps the row from reshuffling as chips are toggled.
  const [quickStuck] = useState(() =>
    quickPicks(stuckIds, recentlyStuck(entries, RECENT_CLASS_COUNT), (id) => findSituation(lib, id) !== null),
  );
  const [quickTechniques] = useState(() =>
    quickPicks(techniqueIds, recentlyPractised(entries, RECENT_CLASS_COUNT), (id) => lib.transitionById.has(id)),
  );
  const otherSituations = situations.filter((situation) => !quickStuck.includes(situation.id));
  const hasNotes = taught !== '' || worked !== '' || struggled !== '';

  return (
    <form id={FORM_ID} className="log-form" onSubmit={submit}>
      <div className="log-form-head">
        <h2>{entry ? `Edit ${formatDay(entry.day)}` : 'Log a class'}</h2>
        <input type="date" aria-label="Day" value={day} onChange={(e) => setDay(e.target.value)} required />
      </div>

      <fieldset className="chip-field">
        <legend>Minutes on the mat</legend>
        <div className="chip-list">
          {MINUTE_PRESETS.map((preset) => (
            <ToggleChip
              key={preset}
              pressed={!otherMinutes && Number(minutes) === preset}
              onToggle={() => {
                setOtherMinutes(false);
                setMinutes(String(preset));
              }}
            >
              {preset}
            </ToggleChip>
          ))}
          <ToggleChip pressed={otherMinutes} onToggle={() => setOtherMinutes(true)}>
            Other
          </ToggleChip>
        </div>
        {otherMinutes && (
          <input
            type="number"
            aria-label="Minutes on the mat"
            min={0}
            step={MINUTES_STEP}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            inputMode="numeric"
            required
          />
        )}
      </fieldset>

      {situations.length > 0 && (
        <fieldset className="chip-field">
          <legend>Where I got stuck</legend>
          <p className="hint">
            Cards you have not studied yet for these, and for your techniques from them, come first in review.
          </p>
          {quickStuck.length > 0 && (
            <div className="chip-list">
              {situations
                .filter((situation) => quickStuck.includes(situation.id))
                .map((situation) => (
                  <ToggleChip
                    key={situation.id}
                    pressed={stuckIds.includes(situation.id)}
                    onToggle={(picked) => toggleStuck(situation.id, picked)}
                  >
                    {situation.name}
                  </ToggleChip>
                ))}
            </div>
          )}
          {otherSituations.length > 0 && (
            <details className="chip-more" open={quickStuck.length === 0}>
              <summary>{quickStuck.length === 0 ? 'Choose positions' : 'Other positions'}</summary>
              <div className="chip-list">
                {otherSituations.map((situation) => (
                  <ToggleChip
                    key={situation.id}
                    pressed={stuckIds.includes(situation.id)}
                    onToggle={(picked) => toggleStuck(situation.id, picked)}
                  >
                    {situation.name}
                  </ToggleChip>
                ))}
              </div>
            </details>
          )}
        </fieldset>
      )}

      {groups.length > 0 && (
        <fieldset className="chip-field">
          <legend>Techniques practised</legend>
          {quickTechniques.length > 0 && (
            <div className="chip-list">
              {quickTechniques.map((id) => (
                <ToggleChip
                  key={id}
                  pressed={techniqueIds.includes(id)}
                  onToggle={(picked) => toggleTechnique(id, picked)}
                >
                  {lib.transitionById.get(id)?.name}
                </ToggleChip>
              ))}
            </div>
          )}
          <details className="chip-more">
            <summary>{quickTechniques.length === 0 ? 'Choose techniques' : 'All techniques'}</summary>
            {groups.map(({ position, techniques }) => (
              <div key={position.id}>
                <h3 className="chip-group">{position.name}</h3>
                <div className="chip-list">
                  {techniques.map((technique) => (
                    <ToggleChip
                      key={technique.id}
                      pressed={techniqueIds.includes(technique.id)}
                      onToggle={(picked) => toggleTechnique(technique.id, picked)}
                    >
                      {technique.name}
                    </ToggleChip>
                  ))}
                </div>
              </div>
            ))}
          </details>
        </fieldset>
      )}

      <Field label="One thing to work on next time" hint="Shown on Today until your next entry sets a new one.">
        <input value={focus} onChange={(e) => setFocus(e.target.value)} />
      </Field>

      {/* The chips cover a quick entry; writing is there for the days there is more to say. */}
      <details className="log-notes" open={hasNotes}>
        <summary>Notes: what was taught, what worked</summary>
        <Field label="What was taught">
          <textarea rows={2} value={taught} onChange={(e) => setTaught(e.target.value)} />
        </Field>
        <Field label="What worked in rolling">
          <textarea rows={2} value={worked} onChange={(e) => setWorked(e.target.value)} />
        </Field>
        <Field label="Where I got stuck, in my own words">
          <textarea rows={2} value={struggled} onChange={(e) => setStruggled(e.target.value)} />
        </Field>
      </details>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {/* Pinned above the tab bar on a phone, so saving never needs a scroll. */}
      <div className="action-bar">
        <button type="submit" className="primary large" disabled={saving}>
          {entry ? 'Save changes' : 'Save entry'}
        </button>
        {entry && (
          <button type="button" className="large" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function EntryRow({ lib, entry, onEdit }: { lib: Library; entry: TrainingEntry; onEdit: () => void }) {
  function remove() {
    if (confirm(`Delete the entry for ${formatDay(entry.day)}?`))
      trainingLog.remove(entry.id).catch(() => alert(DELETE_FAILED));
  }
  const techniques = entry.techniqueIds.map((id) => lib.transitionById.get(id)).filter((t) => t !== undefined);
  const stuck = stuckSituationIds(entry)
    .map((id) => findSituation(lib, id))
    .filter((situation) => situation !== null);
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
      {stuck.length > 0 && (
        <>
          <p>
            <strong>Stuck in:</strong>
          </p>
          <ul className="chip-list">
            {stuck.map((situation) => (
              <li key={`${situation.position.id}:${situation.role}`}>
                <Link className="chip" to={positionSidePath(situation.position.id, situation.role)}>
                  {situationName(situation)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
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
    <div className="stack log-page">
      <div>
        <h1>Training log</h1>
        <p className="muted">
          Write up each class while it is fresh. The one thing you pick to work on next time shows on Today.
        </p>
      </div>
      <div className="log-layout">
        <div className="card">
          <EntryForm
            key={`${editing?.id ?? 'new'}:${formRound}`}
            lib={lib}
            entries={entries}
            entry={editing}
            onDone={finishForm}
          />
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
    </div>
  );
}
