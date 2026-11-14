import { useState } from 'react';
import { items, type PositionInput } from '../../../data';
import { CATEGORY_LABELS } from '../../../domain/labels';
import { POSITION_CATEGORIES, type Position, type PositionCategory } from '../../../domain/types';
import {
  Field,
  FormShell,
  fromLines,
  type ItemFormProps,
  NameField,
  NotesField,
  nextOrder,
  OrderField,
  toLines,
} from './shared';

interface Draft {
  name: string;
  summary: string;
  category: PositionCategory;
  topGoals: string;
  bottomGoals: string;
  conceptIds: string[];
  order: number;
  notes: string;
}

function toDraft(position: Position | undefined, defaultOrder: number): Draft {
  return {
    name: position?.name ?? '',
    summary: position?.summary ?? '',
    category: position?.category ?? 'guard',
    topGoals: fromLines(position?.topGoals ?? []),
    bottomGoals: fromLines(position?.bottomGoals ?? []),
    conceptIds: position?.conceptIds ?? [],
    order: position?.order ?? defaultOrder,
    notes: position?.notes ?? '',
  };
}

function fromDraft(draft: Draft): PositionInput {
  return {
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    category: draft.category,
    topGoals: toLines(draft.topGoals),
    bottomGoals: toLines(draft.bottomGoals),
    conceptIds: draft.conceptIds,
    order: draft.order,
    notes: draft.notes.trim(),
  };
}

export function PositionForm({ itemId, library, cancelTo, onSaved, onDelete }: ItemFormProps) {
  // Read once on mount: later live updates must not overwrite what the user is typing.
  const [draft, setDraft] = useState(() =>
    toDraft(itemId ? library.positionById.get(itemId) : undefined, nextOrder(library.positions)),
  );
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleConcept = (conceptId: string, checked: boolean) =>
    set('conceptIds', checked ? [...draft.conceptIds, conceptId] : draft.conceptIds.filter((c) => c !== conceptId));

  return (
    <FormShell
      cancelTo={cancelTo}
      onDelete={onDelete}
      onSubmit={async () => onSaved(await items.savePosition(itemId, fromDraft(draft)))}
    >
      <NameField value={draft.name} onChange={(v) => set('name', v)} />
      <Field label="Summary" hint="One plain-language sentence.">
        <textarea rows={2} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
      </Field>
      <Field label="Category">
        <select value={draft.category} onChange={(e) => set('category', e.target.value as PositionCategory)}>
          {POSITION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>
      <div className="two-col">
        <Field label="Goals on top / attacking" hint="One per line.">
          <textarea rows={4} value={draft.topGoals} onChange={(e) => set('topGoals', e.target.value)} />
        </Field>
        <Field label="Goals on bottom / defending" hint="One per line.">
          <textarea rows={4} value={draft.bottomGoals} onChange={(e) => set('bottomGoals', e.target.value)} />
        </Field>
      </div>
      <fieldset>
        <legend>Related concepts</legend>
        <div className="checks">
          {library.concepts.map((c) => (
            <label key={c.id} className="check">
              <input
                type="checkbox"
                checked={draft.conceptIds.includes(c.id)}
                onChange={(e) => toggleConcept(c.id, e.target.checked)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <OrderField value={draft.order} onChange={(v) => set('order', v)} />
      <NotesField value={draft.notes} onChange={(v) => set('notes', v)} />
    </FormShell>
  );
}
