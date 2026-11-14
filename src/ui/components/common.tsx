import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isLearned } from '../../domain/srs';
import type { ReviewState } from '../../domain/types';

export function Loading() {
  return <p className="muted">Loading…</p>;
}

export function Missing({ what, back }: { what: string; back: { to: string; label: string } }) {
  return (
    <div className="card">
      <h1>{what} not found</h1>
      <p className="muted">It may have been deleted or replaced by an imported backup.</p>
      <Link to={back.to}>← {back.label}</Link>
    </div>
  );
}

export function Bullets({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  if (items.length === 0) return <p className="muted">Nothing here yet.</p>;
  const children = items.map((text, position) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: plain strings have no identity and may repeat; the list is never reordered while shown
    <li key={position}>{text}</li>
  ));
  return ordered ? <ol className="steps">{children}</ol> : <ul className="bullets">{children}</ul>;
}

export function ProgressDot({ state }: { state: ReviewState | undefined }) {
  const status = !state ? 'new' : isLearned(state) ? 'learned' : 'learning';
  const label = status === 'new' ? 'Not studied yet' : status === 'learned' ? 'Learned' : 'Learning';
  return <span className={`dot dot-${status}`} title={label} aria-label={label} role="img" />;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NotesBlock({ notes }: { notes: string }) {
  if (!notes.trim()) return null;
  return (
    <Section title="My notes">
      <p className="notes">{notes}</p>
    </Section>
  );
}
