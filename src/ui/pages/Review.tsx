import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLibrary, useStudyStats, useTrainingLog } from '../../bindings';
import { GRADE_LABELS, KIND_GROUP_LABELS, plural } from '../../core/labels';
import { reviewOf } from '../../core/library';
import { DECKS, type Deck, GRADES, type Grade } from '../../core/models';
import { describeInterval, newReviewState } from '../../core/srs';
import { buildQueue, DEFAULT_NEW_CARDS, type StudyItem } from '../../core/study';
import { RECENT_CLASS_COUNT, studyFirst } from '../../core/trainingLog';
import { Loading } from '../components/common';
import { CardAnswer, CardCue, cardPrompt } from '../components/StudyCard';
import { EmptyState } from '../graphics/EmptyState';
import { Icon } from '../graphics/icons';
import { prefersReducedMotion } from '../graphics/motion';
import { ProgressBar } from '../graphics/ProgressBar';
import { DECK_PARAM, ROUTES, studyItemPath } from '../routes';
import { type GradeTally, useReviewSession } from './useReviewSession';

const DECK_LABELS: Record<Deck, string> = {
  all: 'Everything',
  ...KIND_GROUP_LABELS,
  situation: 'Situations',
  blueBelt: 'Blue belt test',
};
/** Keyboard shortcut for each grade: its place in the row, starting from 1. */
const GRADE_BUTTONS = GRADES.map((grade, index) => ({ grade, label: GRADE_LABELS[grade], key: String(index + 1) }));
/** Leaves a session, like its close button. */
const END_KEY = 'Escape';
const DECK_LABEL_ID = 'review-deck-label';
const GRADES_LABEL_ID = 'review-grades-label';
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

function SessionComplete(props: {
  doneCount: number;
  tally: GradeTally;
  /** The next round with the same deck and new-card setting; empty when nothing is left. */
  nextRound: StudyItem[];
  onAgain: () => void;
}) {
  const { doneCount, tally, nextRound, onAgain } = props;
  const stats = useStudyStats();
  // Offer another round only when one exists; otherwise the next step is to leave.
  const moreWaiting = nextRound.length;
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
        <p className="muted">
          {moreWaiting > 0
            ? `${plural(moreWaiting, 'more card')} ready if you want another round.`
            : 'Nothing else is due. Come back tomorrow.'}
        </p>
        <div className="complete-actions">
          {moreWaiting > 0 ? (
            <>
              <button type="button" className="primary" onClick={onAgain}>
                Keep going
              </button>
              <Link className="button" to={ROUTES.home}>
                Done for now
              </Link>
            </>
          ) : (
            <>
              <Link className="button primary" to={ROUTES.home}>
                Done
              </Link>
              <Link className="button" to={ROUTES.positions}>
                Positions
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Review() {
  const lib = useLibrary();
  const log = useTrainingLog();
  const session = useReviewSession(lib);
  const [params] = useSearchParams();
  // A list page can open the review on its own deck; anything unrecognised falls back to everything.
  const [deck, setDeck] = useState<Deck>(() => DECKS.find((d) => d === params.get(DECK_PARAM)) ?? 'all');
  const [newLimit, setNewLimit] = useState(DEFAULT_NEW_CARDS);
  /** The grade just given, while its card slides away. */
  const [leaving, setLeaving] = useState<Grade | null>(null);

  const { status, revealed, reveal, grade, end: endSession } = session;

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
      if (e.key === END_KEY) {
        endSession();
        return;
      }
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
  }, [status, revealed, reveal, gradeWithFeedback, endSession]);

  if (!lib) return <Loading />;
  // While the log is still loading the queue is built without it; it only changes the order of new cards.
  const practised = studyFirst(lib, log ?? [], RECENT_CLASS_COUNT);

  if (status === 'idle') {
    const preview = buildQueue(lib, deck, newLimit, Date.now(), practised);
    const newCount = Math.min(newLimit, preview.fresh.length);
    return (
      <div className="stack narrow-page">
        <h1>Review</h1>
        <div className="card stack">
          {preview.queue.length === 0 ? (
            <EmptyState icon="check" title="Nothing to review right now">
              {preview.fresh.length > 0
                ? 'No cards are due. Raise the new-cards slider to learn something new.'
                : 'No cards are due in this deck. Come back later, or pick another deck.'}
            </EmptyState>
          ) : (
            <div className="session-ready">
              <div>
                <p className="session-count">{plural(preview.queue.length, 'card')} ready</p>
                <p className="muted">
                  {preview.due.length} due · {newCount} new
                  {preview.fresh.length > newCount && ` · ${preview.fresh.length - newCount} more not started`}
                </p>
                {preview.fromClass > 0 && (
                  <p className="muted small">
                    {preview.fromClass === 1
                      ? '1 new card is from your recent classes, so it comes first.'
                      : `${preview.fromClass} of the new cards are from your recent classes, so they come first.`}
                  </p>
                )}
              </div>
              <button type="button" className="primary large" onClick={() => session.start(preview.queue)}>
                Start session
                <Icon name="arrow" />
              </button>
            </div>
          )}
          <div className="session-options stack">
            <div className="option">
              <span id={DECK_LABEL_ID}>What to study</span>
              {/* One control at every width: on a phone the row scrolls sideways instead of wrapping. */}
              <fieldset className="segmented deck-switch" aria-labelledby={DECK_LABEL_ID}>
                {DECKS.map((d) => (
                  <button key={d} type="button" aria-pressed={deck === d} onClick={() => setDeck(d)}>
                    {DECK_LABELS[d]}
                  </button>
                ))}
              </fieldset>
            </div>
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
          </div>
        </div>
        <p className="muted small">
          Read the question, answer it in your head (or out loud), then reveal and rate how well you knew it. Cards you
          know well come back less often.
        </p>
      </div>
    );
  }

  if (status === 'finished') {
    const nextRound = buildQueue(lib, deck, newLimit, Date.now(), practised).queue;
    return (
      <SessionComplete
        doneCount={session.doneCount}
        tally={session.tally}
        nextRound={nextRound}
        onAgain={() => session.start(nextRound)}
      />
    );
  }

  const { current } = session;
  const prompt = current ? cardPrompt(current, lib) : null;
  if (!current || !prompt) return <Loading />;
  const now = Date.now();
  const state = reviewOf(lib, current.kind, current.id) ?? newReviewState(current.kind, current.id, now);

  const total = session.doneCount + session.remaining;
  return (
    <div className="narrow-page review-session">
      <div className="review-head">
        <button
          type="button"
          className="icon-button"
          aria-label="End session"
          aria-keyshortcuts={END_KEY}
          onClick={endSession}
        >
          <Icon name="close" />
        </button>
        <ProgressBar value={session.doneCount} max={total} label="Session progress" />
        <span className="muted small">
          {session.doneCount + 1} of {total}
        </span>
      </div>
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
                  <Link to={studyItemPath(current)} target="_blank">
                    Open full page ↗
                  </Link>
                </p>
              </div>
            ) : (
              <CardCue item={current} lib={lib} />
            )}
          </div>
        </div>
      </div>
      <p className="visually-hidden" role="status">
        {revealed ? 'Answer shown. Rate how well you knew it.' : ''}
      </p>
      {/* Pinned to the bottom of the screen, under the thumb, however long the card is. */}
      <div className="review-dock">
        {revealed ? (
          <>
            <p className="muted small" id={GRADES_LABEL_ID}>
              How well did you know it?
            </p>
            <fieldset className="grades" aria-labelledby={GRADES_LABEL_ID}>
              {GRADE_BUTTONS.map((b) => (
                <button
                  key={b.grade}
                  type="button"
                  className={`grade grade-${b.grade}`}
                  disabled={session.saving || leaving !== null}
                  aria-keyshortcuts={b.key}
                  onClick={() => void gradeWithFeedback(b.grade)}
                >
                  <span>{b.label}</span>
                  <span className="small">{describeInterval(state, b.grade, now)}</span>
                  <kbd>{b.key}</kbd>
                </button>
              ))}
            </fieldset>
          </>
        ) : (
          <>
            <p className="muted small">Answer in your head or out loud, then check.</p>
            <button type="button" className="primary large reveal" aria-keyshortcuts="Space Enter" onClick={reveal}>
              Show answer <kbd>Space</kbd>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
