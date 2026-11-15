import { items } from '../../../bindings';
import type { Concept } from '../../../core/models';
import type { ConceptInput } from '../../../core/services/items';
import {
  Field,
  FormShell,
  fromLines,
  type ItemFormProps,
  NameField,
  NotesField,
  nextOrder,
  OrderField,
  SummaryField,
  toLines,
  useDraft,
} from './shared';

interface Draft {
  name: string;
  summary: string;
  keyPoints: string;
  drill: string;
  order: number;
  notes: string;
}

function toDraft(concept: Concept | undefined, defaultOrder: number): Draft {
  return {
    name: concept?.name ?? '',
    summary: concept?.summary ?? '',
    keyPoints: fromLines(concept?.keyPoints ?? []),
    drill: concept?.drill ?? '',
    order: concept?.order ?? defaultOrder,
    notes: concept?.notes ?? '',
  };
}

function fromDraft(draft: Draft): ConceptInput {
  return {
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    keyPoints: toLines(draft.keyPoints),
    drill: draft.drill.trim(),
    order: draft.order,
    notes: draft.notes.trim(),
  };
}

export function ConceptForm({ itemId, library, cancelTo, onSaved, onDelete }: ItemFormProps) {
  const [draft, set] = useDraft(() =>
    toDraft(itemId ? library.conceptById.get(itemId) : undefined, nextOrder(library.concepts)),
  );

  return (
    <FormShell
      cancelTo={cancelTo}
      onDelete={onDelete}
      onSubmit={async () => onSaved(await items.saveConcept(itemId, fromDraft(draft)))}
    >
      <NameField value={draft.name} onChange={(v) => set('name', v)} />
      <SummaryField value={draft.summary} onChange={(v) => set('summary', v)} />
      <Field label="Key points" hint="One per line.">
        <textarea rows={5} value={draft.keyPoints} onChange={(e) => set('keyPoints', e.target.value)} />
      </Field>
      <Field label="Drill">
        <textarea rows={2} value={draft.drill} onChange={(e) => set('drill', e.target.value)} />
      </Field>
      <OrderField value={draft.order} onChange={(v) => set('order', v)} />
      <NotesField value={draft.notes} onChange={(v) => set('notes', v)} />
    </FormShell>
  );
}
