import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { items } from '../../../bindings';
import { isOnBlueBeltTest } from '../../../core/beltTest';
import { TRANSITION_LABELS } from '../../../core/labels';
import { TRANSITION_TYPES, type Transition, type TransitionType } from '../../../core/models';
import type { TransitionInput } from '../../../core/services/items';
import { Field, FormShell, fromLines, type ItemFormProps, NameField, NotesField, toLines } from './shared';

interface Draft {
  name: string;
  type: TransitionType;
  fromId: string;
  toId: string;
  steps: string;
  commonMistakes: string;
  blueBeltTest: boolean;
  notes: string;
}

function toDraft(transition: Transition | undefined, defaultFromId: string): Draft {
  return {
    name: transition?.name ?? '',
    type: transition?.type ?? 'sweep',
    fromId: transition?.fromId ?? defaultFromId,
    toId: transition?.toId ?? '',
    steps: fromLines(transition?.steps ?? []),
    commonMistakes: fromLines(transition?.commonMistakes ?? []),
    blueBeltTest: transition ? isOnBlueBeltTest(transition) : false,
    notes: transition?.notes ?? '',
  };
}

function fromDraft(draft: Draft): TransitionInput {
  return {
    name: draft.name.trim(),
    type: draft.type,
    fromId: draft.fromId,
    // A submission ends the roll, so it has no destination position.
    toId: draft.type === 'submission' ? '' : draft.toId,
    steps: toLines(draft.steps),
    commonMistakes: toLines(draft.commonMistakes),
    blueBeltTest: draft.blueBeltTest,
    notes: draft.notes.trim(),
  };
}

export function TransitionForm({ itemId, library, cancelTo, onSaved, onDelete }: ItemFormProps) {
  const [search] = useSearchParams();
  // Read once on mount: later live updates must not overwrite what the user is typing.
  const [draft, setDraft] = useState(() => {
    const requestedFrom = search.get('from') ?? '';
    const defaultFrom = library.positionById.has(requestedFrom) ? requestedFrom : '';
    return toDraft(itemId ? library.transitionById.get(itemId) : undefined, defaultFrom);
  });
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const positionOptions = library.positions.map((p) => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ));

  return (
    <FormShell
      cancelTo={cancelTo}
      onDelete={onDelete}
      onSubmit={async () => onSaved(await items.saveTransition(itemId, fromDraft(draft)))}
    >
      <NameField value={draft.name} onChange={(v) => set('name', v)} />
      <Field label="Type">
        <select value={draft.type} onChange={(e) => set('type', e.target.value as TransitionType)}>
          {TRANSITION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRANSITION_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <div className="row">
        <Field label="From position" className="grow">
          <select value={draft.fromId} onChange={(e) => set('fromId', e.target.value)} required>
            <option value="" disabled>
              Choose…
            </option>
            {positionOptions}
          </select>
        </Field>
        {draft.type !== 'submission' && (
          <Field label="Ends in" className="grow">
            <select value={draft.toId} onChange={(e) => set('toId', e.target.value)} required>
              <option value="" disabled>
                Choose…
              </option>
              {positionOptions}
            </select>
          </Field>
        )}
      </div>
      <Field label="Steps" hint="One step per line, in order.">
        <textarea rows={6} value={draft.steps} onChange={(e) => set('steps', e.target.value)} />
      </Field>
      <Field label="Common mistakes" hint="One per line.">
        <textarea rows={3} value={draft.commonMistakes} onChange={(e) => set('commonMistakes', e.target.value)} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={draft.blueBeltTest} onChange={(e) => set('blueBeltTest', e.target.checked)} />
        On the blue belt test
      </label>
      <NotesField value={draft.notes} onChange={(v) => set('notes', v)} />
    </FormShell>
  );
}
