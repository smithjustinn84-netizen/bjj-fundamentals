import { type FormEvent, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Library } from '../../../core/library';

/** What every item form receives. A new kind of item only needs a component with these props. */
export interface ItemFormProps {
  /** The item being edited, or null when creating a new one. */
  itemId: string | null;
  library: Library;
  cancelTo: string;
  onSaved: (id: string) => void;
  /** Present only when editing an existing item. */
  onDelete?: () => void;
}

/**
 * A form's working copy and a setter for one field. `init` runs once on mount, so later live updates
 * to the library cannot overwrite what the user is typing.
 */
export function useDraft<Draft>(init: () => Draft) {
  const [draft, setDraft] = useState(init);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  return [draft, set] as const;
}

/** List fields are edited as one entry per line. */
export const toLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
export const fromLines = (list: string[]) => list.join('\n');

export function Field(props: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children, so it is nested inside this label
    <label className={props.className}>
      {props.label}
      {props.hint && <span className="hint">{props.hint}</span>}
      {props.children}
    </label>
  );
}

/** The card, submit handling and Save / Cancel / Delete row shared by every item form. */
export function FormShell(props: {
  onSubmit: () => Promise<void>;
  cancelTo: string;
  onDelete?: () => void;
  children: ReactNode;
}) {
  function submit(e: FormEvent) {
    e.preventDefault();
    void props.onSubmit();
  }
  return (
    <form className="card stack" onSubmit={submit}>
      {props.children}
      <div className="row">
        <button type="submit" className="primary">
          Save
        </button>
        <Link to={props.cancelTo} className="button">
          Cancel
        </Link>
        {props.onDelete && (
          <button type="button" className="danger push-right" onClick={props.onDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

export function NameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Name">
      <input value={value} onChange={(e) => onChange(e.target.value)} required />
    </Field>
  );
}

export function SummaryField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Summary" hint="One plain-language sentence.">
      <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** A select over one of the `const` lists in `core/models.ts`. */
export function ChoiceField<T extends string>(props: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={props.label}>
      <select
        value={props.value}
        onChange={(e) => {
          const picked = props.options.find((option) => option === e.target.value);
          if (picked !== undefined) props.onChange(picked);
        }}
      >
        {props.options.map((option) => (
          <option key={option} value={option}>
            {props.labels[option]}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function NotesField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="My notes" hint="Anything from class you want to remember.">
      <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function OrderField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Field label="Learning order" hint="Lower numbers come first in lists and reviews.">
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </Field>
  );
}

/** The order value that places a new item at the end of a list. */
export function nextOrder(list: { order: number }[]): number {
  return list.reduce((max, item) => Math.max(max, item.order), 0) + 1;
}
