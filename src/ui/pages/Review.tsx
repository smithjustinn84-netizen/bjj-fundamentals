import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary, useStudyStats } from '../../bindings';
import { GRADE_LABELS, KIND_GROUP_LABELS, plural } from '../../core/labels';
import { reviewOf } from '../../core/library';
import { DECKS, type Deck, GRADES, type Grade } from '../../core/models';
import { describeInterval, newReviewState } from '../../core/srs';
import { buildQueue } from '../../core/study';
import { Loading } from '../components/common';
import { CardAnswer, cardPrompt } from '../components/StudyCard';
import { EmptyState } from '../graphics/EmptyState';
import { Icon } from '../graphics/icons';
import { prefersReducedMotion } from '../graphics/motion';
import { ProgressBar } from '../graphics/ProgressBar';
import { itemPath, ROUTES } from '../routes';
import { type GradeTally, useReviewSession } from './useReviewSession';

const DECK_LABELS: Record<Deck, string> = { all: 'Everything', ...KIND_GROUP_LABELS };
/** Keyboard shortcut for each grade: its place in the row, starting from 1. */
const GRADE_BUTTONS = GRADES.map((grade, index) => ({ grade, label: GRADE_LABELS[grade], key: String(index + 1) }));
const DEFAULT_NEW_CARDS = 5;
const MAX_NEW_CARDS = 20;
/** How long a graded card takes to slide away: `--dur-base`, which the `card-leave` animation in review.css uses. */
const CARD_LEAVE_MS = 220;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;

/** How the session's answers split across the four grades, as one stacked bar with a legend. */
function GradeBreakdown({ tally }: { tally: GradeTally }) {
  return (
    <div>
      <div className="breakdown-bar" aria-hidden="true">
        {GRADES.filter((grade) => tally[grade] > 0).map((grade) => (
          <span key={grade} className={`grade-${grade}`} style={{ flexGrow: tally[grade] }} />
        ))}
      </div>
      <ul className="breakdown-legend">
        {GRADES.map((grade) => (
          <li key={grade} className={`grade-${grade}`}>
            <span className="swatch" aria-hidden="true" />
            {GRADE_LABELS[grade]} <strong>{tally[grade]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionComplete({ doneCount, tally, onAgain }: { doneCount: number; tally: GradeTally; onAgain: () => void }) {
  const stats = useStudyStats();
  return (
    <div className="stack narrow-page">
      <div className="card center session-complete">
        <svg className="complete-mark" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" />
          <path d="m20 33 8.5 8.5L45 24" />
        </svg>
        <h1>Session complete</h1>
        <p className="lead">You reviewed {plural(doneCount, 'card')}. Nice work.</p>
        <GradeBreakdown tally={tally} />
        {stats && stats.streakDays > 0 && (
          <p className="streak-line">
            <Icon name="flame" /> {plural(stats.streakDays, 'day')} in a row
          </p>
        )}
        <div className="row center">
          <button type="button" className="primary" onClick={onAgain}>
            Back to review
          </button>
          <Link className="button" to={ROUTES.positions}>
            Position map
          </Link>
          <Link className="button" to={ROUTES.home}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Review() {
  const lib = useLibrary();
  const session = useReviewSession(lib);
  const [deck, setDeck] = useState<Deck>('all');
  const [newLimit, setNewLimit] = useState(DEFAULT_NEW_CARDS);
  /** The grade just given, while its card slides away. */
  const [leaving, setLeaving] = useState<Grade | null>(null);

  const { status, revealed, reveal, grade } = session;

  const gradeWithFeedback = useCallback(
    async (value: Grade) => {
      if (leaving) return;
      setLeaving(value);
      try {
        if (!prefersReducedMotion()) await new Promise((resolve) => setTimeout(resolve, CARD_LEAVE_MS));
        await grade(value);
      } finally {
        setLeaving(null);
      }
    },
    [leaving, grade],
  );

  useEffect(() => {
    if (status !== 'active') return;
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
        return;
      }
      const match = revealed ? GRADE_BUTTONS.find((b) => b.key === e.key) : undefined;
      if (match) void gradeWithFeedback(match.grade);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, revealed, reveal, gradeWithFeedback]);

  if (!lib) return <Loading />;

  if (status === 'idle') {
    const preview = buildQueue(lib, deck, newLimit, Date.now());
    return (
      <div className="stack narrow-page">
        <h1>Review</h1>
        <div className="card stack">
          <p className="muted">
            Read the question, answer it in your head (or out loud), then reveal and rate how well you knew it. Cards
            you know well come back less often.
          </p>
          <label>
            What to study
            {/* The cast is safe: every option's value comes from DECKS. */}
            <select value={deck} onChange={(e) => setDeck(e.target.value as Deck)}>
              {DECKS.map((d) => (
                <option key={d} value={d}>
                  {DECK_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              New cards this session: <strong>{newLimit}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={MAX_NEW_CARDS}
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
            />
          </label>
          {preview.queue.length === 0 ? (
            <EmptyState icon="check" title="Nothing to review right now">
              {preview.fresh.length > 0
                ? 'No cards are due. Raise the new-cards slider to learn something new.'
                : 'No cards are due in this deck. Come back later, or pick another deck.'}
            </EmptyState>
          ) : (
            <>
              <p>
                <strong>{preview.due.length}</strong> due · <strong>{Math.min(newLimit, preview.fresh.length)}</strong>{' '}
                new
                {preview.fresh.length > newLimit && (
                  <span className="muted"> ({preview.fresh.length} not started)</span>
                )}
              </p>
              <button type="button" className="primary" onClick={() => session.start(preview.queue)}>
                Start ({plural(preview.queue.length, 'card')})
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (status === 'finished') {
    return <SessionComplete doneCount={session.doneCount} tally={session.tally} onAgain={session.end} />;
  }

  const { current } = session;
  const prompt = current ? cardPrompt(current, lib) : null;
  if (!current || !prompt) return <Loading />;
  const now = Date.now();
  const state = reviewOf(lib, current.kind, current.id) ?? newReviewState(current.kind, current.id, now);

  return (
    <div className="stack narrow-page">
      <div className="review-head">
        <button type="button" className="link small" onClick={session.end}>
          ← End session
        </button>
        <span className="muted small">
          {session.remaining} left · {session.doneCount} done
        </span>
      </div>
      <ProgressBar value={session.doneCount} max={session.doneCount + session.remaining} label="Session progress" />
      <div className="card-stage">
        {/* Keyed per card and per answer given, so each new card (or a repeated one) slides in afresh. */}
        <div
          key={`${current.kind}:${current.id}:${session.doneCount}`}
          className={`card-slot${leaving ? ` card-leaving grade-${leaving}` : ''}`}
        >
          {/* Keyed on the side showing, so revealing the answer replays the flip. */}
          <div
            key={revealed ? 'answer' : 'question'}
            className={`card flashcard${revealed ? ' flashcard-flipped' : ''}`}
          >
            <p className="eyebrow">{prompt.eyebrow}</p>
            <h2 className="question">{prompt.question}</h2>
            {revealed ? (
              <div className="answer">
                <CardAnswer item={current} lib={lib} />
                <p className="small">
                  <Link to={itemPath(current.kind, current.id)} target="_blank">
                    Open full page ↗
                  </Link>
                </p>
              </div>
            ) : (
              <button type="button" className="primary reveal" onClick={reveal}>
                Show answer <kbd>Space</kbd>
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="visually-hidden" role="status">
        {revealed ? 'Answer shown. Rate how well you knew it.' : ''}
      </p>
      {revealed && (
        <fieldset className="grades" aria-label="How well did you know it?">
          {GRADE_BUTTONS.map((b) => (
            <button
              key={b.grade}
              type="button"
              className={`grade grade-${b.grade}`}
              disabled={session.saving || leaving !== null}
              onClick={() => void gradeWithFeedback(b.grade)}
            >
              <span>{b.label}</span>
              <span className="small">{describeInterval(state, b.grade, now)}</span>
              <kbd>{b.key}</kbd>
            </button>
          ))}
        </fieldset>
      )}
    </div>
  );
}
