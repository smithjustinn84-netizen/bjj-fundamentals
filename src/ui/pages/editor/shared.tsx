import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Library } from '../../../domain/library';

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
