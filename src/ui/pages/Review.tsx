import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../data';
import { cardId, describeInterval, newReviewState } from '../../domain/srs';
import { buildQueue, type Deck } from '../../domain/study';
import type { Grade } from '../../domain/types';
import { Loading } from '../components/common';
import { CardAnswer, cardPrompt } from '../components/StudyCard';
import { itemPath, ROUTES } from '../routes';
import { useReviewSession } from './useReviewSession';

const DECKS: { value: Deck; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'concept', label: 'Concepts' },
  { value: 'position', label: 'Positions' },
  { value: 'transition', label: 'Techniques' },
];
const GRADE_BUTTONS: { grade: Grade; label: string; key: string }[] = [
  { grade: 'again', label: 'Again', key: '1' },
  { grade: 'hard', label: 'Hard', key: '2' },
  { grade: 'good', label: 'Good', key: '3' },
  { grade: 'easy', label: 'Easy', key: '4' },
];
const DEFAULT_NEW_CARDS = 5;
const MAX_NEW_CARDS = 20;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;

export default function Review() {
  const lib = useLibrary();
  const session = useReviewSession(lib);
  const [deck, setDeck] = useState<Deck>('all');
  const [newLimit, setNewLimit] = useState(DEFAULT_NEW_CARDS);

  const { status, revealed, reveal, grade } = session;
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
      if (match) void grade(match.grade);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, revealed, reveal, grade]);

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
            <select value={deck} onChange={(e) => setDeck(e.target.value as Deck)}>
              {DECKS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
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
          <p>
            <strong>{preview.due.length}</strong> due · <strong>{Math.min(newLimit, preview.fresh.length)}</strong> new
            {preview.fresh.length > newLimit && <span className="muted"> ({preview.fresh.length} not started)</span>}
          </p>
          <button
            type="button"
            className="primary"
            disabled={preview.queue.length === 0}
            onClick={() => session.start(preview.queue)}
          >
            {preview.queue.length === 0 ? 'Nothing to review right now' : `Start (${preview.queue.length} cards)`}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="stack narrow-page">
        <div className="card center">
          <h1>Session complete</h1>
          <p className="lead">
            You reviewed {session.doneCount} card{session.doneCount === 1 ? '' : 's'}. Nice work.
          </p>
          <div className="row center">
            <button type="button" className="primary" onClick={session.end}>
              Back to review
            </button>
            <Link className="button" to={ROUTES.home}>
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { current } = session;
  const prompt = current ? cardPrompt(current, lib) : null;
  if (!current || !prompt) return <Loading />;
  const now = Date.now();
  const state = lib.reviews.get(cardId(current.kind, current.id)) ?? newReviewState(current.kind, current.id, now);

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
      <div className="card flashcard">
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
      {revealed && (
        <fieldset className="grades" aria-label="How well did you know it?">
          {GRADE_BUTTONS.map((b) => (
            <button
              key={b.grade}
              type="button"
              className={`grade grade-${b.grade}`}
              disabled={session.saving}
              onClick={() => void grade(b.grade)}
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
