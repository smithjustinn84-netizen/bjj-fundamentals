import { useSearchParams } from 'react-router-dom';
import { items } from '../../../bindings';
import { isOnBlueBeltTest } from '../../../core/beltTest';
import { BLUE_BELT_TEST_LABEL, roleLabel, TRANSITION_LABELS } from '../../../core/labels';
import type { Library } from '../../../core/library';
import {
  DEFAULT_TRANSITION_TYPE,
  endsTheRoll,
  POSITION_ROLES,
  type PositionCategory,
  type PositionRole,
  TRANSITION_TYPES,
  type Transition,
  type TransitionType,
} from '../../../core/models';
import { defaultRole, performerRole } from '../../../core/roles';
import type { TransitionInput } from '../../../core/services/items';
import { techniqueDrill } from '../../../core/techniqueDrill';
import { FROM_POSITION_PARAM } from '../../routes';
import {
  ChoiceField,
  Field,
  FormShell,
  fromLines,
  type ItemFormProps,
  NameField,
  NotesField,
  toLines,
  useDraft,
} from './shared';

interface Draft {
  name: string;
  type: TransitionType;
  fromId: string;
  toId: string;
  /** Null until the user picks: the form then shows, and saves, the usual role for the chosen type. */
  role: PositionRole | null;
  steps: string;
  commonMistakes: string;
  drill: string;
  blueBeltTest: boolean;
  notes: string;
}

function toDraft(library: Library, transition: Transition | undefined, defaultFromId: string): Draft {
  return {
    name: transition?.name ?? '',
    type: transition?.type ?? DEFAULT_TRANSITION_TYPE,
    fromId: transition?.fromId ?? defaultFromId,
    toId: transition?.toId ?? '',
    role: transition ? performerRole(library, transition) : null,
    steps: fromLines(transition?.steps ?? []),
    commonMistakes: fromLines(transition?.commonMistakes ?? []),
    drill: transition ? techniqueDrill(transition) : '',
    blueBeltTest: transition ? isOnBlueBeltTest(transition) : false,
    notes: transition?.notes ?? '',
  };
}

/** Role names before a starting position is chosen; after that they come from its kind of position. */
const PLAIN_ROLE_LABELS: Record<PositionRole, string> = { top: 'Top', bottom: 'Bottom' };

function roleLabels(category: PositionCategory | undefined): Record<PositionRole, string> {
  if (!category) return PLAIN_ROLE_LABELS;
  return { top: roleLabel(category, 'top'), bottom: roleLabel(category, 'bottom') };
}

function fromDraft(draft: Draft, role: PositionRole): TransitionInput {
  return {
    name: draft.name.trim(),
    type: draft.type,
    fromId: draft.fromId,
    toId: draft.toId,
    role,
    steps: toLines(draft.steps),
    commonMistakes: toLines(draft.commonMistakes),
    drill: draft.drill.trim(),
    blueBeltTest: draft.blueBeltTest,
    notes: draft.notes.trim(),
  };
}

export function TransitionForm({ itemId, library, cancelTo, onSaved, onDelete }: ItemFormProps) {
  const [search] = useSearchParams();
  const [draft, set] = useDraft(() => {
    const requestedFrom = search.get(FROM_POSITION_PARAM) ?? '';
    const defaultFrom = library.positionById.has(requestedFrom) ? requestedFrom : '';
    return toDraft(library, itemId ? library.transitionById.get(itemId) : undefined, defaultFrom);
  });

  const fromCategory = library.positionById.get(draft.fromId)?.category;
  const role = draft.role ?? defaultRole(draft.type, fromCategory);

  const positionOptions = library.positions.map((p) => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ));

  return (
    <FormShell
      cancelTo={cancelTo}
      onDelete={onDelete}
      onSubmit={async () => onSaved(await items.saveTransition(itemId, fromDraft(draft, role)))}
    >
      <NameField value={draft.name} onChange={(v) => set('name', v)} />
      <ChoiceField
        label="Type"
        options={TRANSITION_TYPES}
        labels={TRANSITION_LABELS}
        value={draft.type}
        onChange={(v) => set('type', v)}
      />
      <div className="row">
        <Field label="From position" className="grow">
          <select value={draft.fromId} onChange={(e) => set('fromId', e.target.value)} required>
            <option value="" disabled>
              Choose…
            </option>
            {positionOptions}
          </select>
        </Field>
        {!endsTheRoll(draft.type) && (
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
      <ChoiceField
        label="Who does it"
        options={POSITION_ROLES}
        labels={roleLabels(fromCategory)}
        value={role}
        onChange={(v) => set('role', v)}
      />
      <Field label="Steps" hint="One step per line, in order.">
        <textarea rows={6} value={draft.steps} onChange={(e) => set('steps', e.target.value)} />
      </Field>
      <Field label="Common mistakes" hint="One per line.">
        <textarea rows={3} value={draft.commonMistakes} onChange={(e) => set('commonMistakes', e.target.value)} />
      </Field>
      <Field label="Drill" hint="A short solo or partner drill to practise it.">
        <textarea rows={2} value={draft.drill} onChange={(e) => set('drill', e.target.value)} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={draft.blueBeltTest} onChange={(e) => set('blueBeltTest', e.target.checked)} />
        {BLUE_BELT_TEST_LABEL}
      </label>
      <NotesField value={draft.notes} onChange={(v) => set('notes', v)} />
    </FormShell>
  );
}
