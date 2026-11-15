import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ReviewState } from '../../core/models';
import { isLearned } from '../../core/srs';
import { Icon } from '../graphics/icons';

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

const STUDY_STATUSES = ['new', 'learning', 'learned'] as const;
type StudyStatus = (typeof STUDY_STATUSES)[number];
const STATUS_LABELS: Record<StudyStatus, string> = {
  new: 'Not studied yet',
  learning: 'Learning',
  learned: 'Learned',
};

function studyStatus(state: ReviewState | undefined): StudyStatus {
  if (!state) return 'new';
  return isLearned(state) ? 'learned' : 'learning';
}

/** How well a card is known, as a dot alone. For rows in a list; pair the list with a `ProgressLegend`. */
export function ProgressDot({ state }: { state: ReviewState | undefined }) {
  const status = studyStatus(state);
  return (
    <span className={`dot dot-${status}`} title={STATUS_LABELS[status]} aria-label={STATUS_LABELS[status]} role="img" />
  );
}

/** How well a card is known, in words. For the one item a page is about. */
export function StudyStatusPill({ state }: { state: ReviewState | undefined }) {
  const status = studyStatus(state);
  return (
    <span className={`status status-${status}`}>
      <span className={`dot dot-${status}`} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** What the three progress dots mean, shown once above a list that uses them. */
export function ProgressLegend() {
  return (
    <ul className="progress-legend" aria-label="What the dots mean">
      {STUDY_STATUSES.map((status) => (
        <li key={status} className="progress-legend-item">
          <span className={`dot dot-${status}`} aria-hidden="true" />
          {STATUS_LABELS[status]}
        </li>
      ))}
    </ul>
  );
}

/**
 * The top of a page about one item: the way back and Edit on one row, then what the item is.
 * `eyebrow` is the small line above the name; `children` is anything that belongs under the summary.
 */
export function DetailHeader(props: {
  back: { to: string; label: string };
  editTo: string;
  eyebrow: ReactNode;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="detail-head">
      <div className="detail-bar">
        <Link to={props.back.to} className="back-link">
          <Icon name="back" />
          {props.back.label}
        </Link>
        <Link className="button small" to={props.editTo}>
          Edit
        </Link>
      </div>
      <p className="eyebrow">{props.eyebrow}</p>
      <h1>{props.title}</h1>
      {props.lead && <p className="lead">{props.lead}</p>}
      {props.children}
    </header>
  );
}

/** Previous and next links at the foot of a detail page. Either side may be absent. */
export function Pager({ previous, next }: { previous?: PagerLink; next?: PagerLink }) {
  if (!previous && !next) return null;
  return (
    <nav className="pager" aria-label="More to read">
      {previous ? (
        <Link className="pager-link" to={previous.to}>
          <span className="muted small">← Previous</span>
          <strong>{previous.label}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link className="pager-link pager-next" to={next.to}>
          <span className="muted small">Next →</span>
          <strong>{next.label}</strong>
        </Link>
      )}
    </nav>
  );
}

export interface PagerLink {
  to: string;
  label: string;
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
