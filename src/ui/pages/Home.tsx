import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary, useStudyStats, useTrainingLog, useVideos } from '../../bindings';
import { BELT_LABELS } from '../../core/labels';
import { reviewOf } from '../../core/library';
import { beltRank } from '../../core/rank';
import { findSituation, situationName } from '../../core/situations';
import { cardId } from '../../core/srs';
import { cardName, conceptsToLearn, progressSummary, STICKING_POINT_LIMIT, stickingPoints } from '../../core/study';
import { type DrillReason, pickDrill } from '../../core/todaysDrill';
import {
  formatClassCount,
  formatMatTime,
  RECENT_CLASS_COUNT,
  recentlyStuck,
  trainingSummary,
} from '../../core/trainingLog';
import { Loading, ProgressDot } from '../components/common';
import { LibrarySearch } from '../components/LibrarySearch';
import { ArtworkFrame, HERO_DOJO_ARTWORK } from '../graphics/Artwork';
import { Belt } from '../graphics/Belt';
import { Icon } from '../graphics/icons';
import { PositionArtwork } from '../graphics/PositionSvg';
import { ProgressBar } from '../graphics/ProgressBar';
import { useCountUp } from '../graphics/useCountUp';
import { itemPath, positionSidePath, ROUTES, studyItemPath } from '../routes';

function reviewButtonLabel(dueCount: number, started: number): string {
  if (dueCount > 0) return `Review ${dueCount} card${dueCount === 1 ? '' : 's'}`;
  return started === 0 ? 'Start studying' : 'Study new cards';
}

/** Home shows only the next few concepts; the Concepts page has them all. */
const HOME_CONCEPT_LIMIT = 6;

/** Why today's drill was chosen, said to the student. */
const DRILL_REASON_TEXT: Record<DrillReason, string> = {
  stuck: 'A way out of where you got stuck in a recent class.',
  slipping: 'This one keeps slipping in review.',
  practised: 'You practised this in a recent class.',
  next: 'The next technique you have not learned yet.',
};

/** Today's date the way the reader's locale writes it, e.g. "Sunday 15 November". */
function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** What the review block says under its number. */
function reviewLine(dueCount: number, started: number): string {
  if (dueCount > 0) return 'A few minutes now keeps them from slipping.';
  return started === 0
    ? 'Start with the first few concepts.'
    : 'Nothing is due. Learn something new while you are here.';
}

/** The one thing to do today: how many cards are due, and the button that starts them. */
function ReviewBlock({ dueCount, started }: { dueCount: number; started: number }) {
  const shown = useCountUp(dueCount);
  return (
    <section className="today-review" aria-label="Review">
      <div className="today-review-count">
        <span className="stat">{shown}</span>
        <div>
          <strong>{dueCount === 1 ? 'card due' : 'cards due'}</strong>
          <span className="block small">{reviewLine(dueCount, started)}</span>
        </div>
      </div>
      <Link className="button large" to={ROUTES.review}>
        {reviewButtonLabel(dueCount, started)}
        <Icon name="arrow" />
      </Link>
    </section>
  );
}

interface PathStep {
  title: string;
  done: boolean;
  body: ReactNode;
}

/** The suggested path as a vertical stepper. The first unfinished step is marked as the current one. */
function PathSteps({ steps }: { steps: PathStep[] }) {
  const currentIndex = steps.findIndex((step) => !step.done);
  return (
    <ol className="path stagger">
      {steps.map((step, index) => {
        const status = step.done ? 'done' : index === currentIndex ? 'current' : 'upcoming';
        return (
          <li
            key={step.title}
            className={`path-step path-${status}`}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className="path-marker" aria-hidden="true">
              {step.done ? <Icon name="check" /> : index + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              {step.done && <span className="visually-hidden"> (done)</span>}
              <p className="muted">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Home() {
  const lib = useLibrary();
  const stats = useStudyStats();
  const videos = useVideos();
  const log = useTrainingLog();
  if (!lib || !stats || !videos || !log) return <Loading />;

  const progress = progressSummary(lib);
  const rank = beltRank(progress.percentLearned);
  const nextConcept = lib.concepts.find((c) => !lib.reviews.has(cardId('concept', c.id)));
  const nextPosition = lib.positions.find((p) => !lib.reviews.has(cardId('position', p.id)));
  const nextTechnique = lib.transitions.find((t) => !lib.reviews.has(cardId('transition', t.id)));

  const sticking = stickingPoints(lib, STICKING_POINT_LIMIT);
  const training = trainingSummary(log);
  const drill = pickDrill(lib, log);
  const nextConcepts = conceptsToLearn(lib, HOME_CONCEPT_LIMIT);
  const stuck = recentlyStuck(log, RECENT_CLASS_COUNT)
    .map((id) => findSituation(lib, id))
    .filter((situation) => situation !== null);

  const steps: PathStep[] = [
    {
      title: 'Core concepts',
      done: lib.concepts.length > 0 && !nextConcept,
      body: (
        <>
          Posture, base, frames, and the shrimp show up everywhere.
          {nextConcept && (
            <>
              {' '}
              Next up: <Link to={itemPath('concept', nextConcept.id)}>{nextConcept.name}</Link>.
            </>
          )}
        </>
      ),
    },
    {
      title: 'The main positions',
      done: lib.positions.length > 0 && !nextPosition,
      body: (
        <>
          Know what each person wants in each one.
          {nextPosition && (
            <>
              {' '}
              Next up: <Link to={itemPath('position', nextPosition.id)}>{nextPosition.name}</Link>.
            </>
          )}
        </>
      ),
    },
    {
      title: 'How positions connect',
      done: lib.transitions.length > 0 && !nextTechnique,
      body: (
        <>
          Sweeps, passes, and escapes move you between them. See the <Link to={ROUTES.positions}>position map</Link>.
          {nextTechnique && (
            <>
              {' '}
              Next up: <Link to={itemPath('transition', nextTechnique.id)}>{nextTechnique.name}</Link>.
            </>
          )}
        </>
      ),
    },
    {
      title: 'Save the best explanations',
      done: videos.length > 0,
      body: (
        <>
          Bookmark the exact moment in a YouTube video on any item, or on the <Link to={ROUTES.videos}>Videos</Link>{' '}
          page.
        </>
      ),
    },
  ];

  return (
    <div className="stack">
      <ArtworkFrame
        src={HERO_DOJO_ARTWORK}
        alt="Sunlit tatami mat room with a folded white gi and black belt"
        className="today-artwork"
        eager
      />
      <header className="today-head">
        <div>
          <p className="eyebrow">{todayLabel()}</p>
          <h1>Today</h1>
        </div>
        {stats.streakDays > 0 && (
          <p className="streak-pill">
            <Icon name="flame" />
            {stats.streakDays}-day streak
          </p>
        )}
      </header>

      <ReviewBlock dueCount={stats.dueCount} started={progress.started} />

      {drill && (
        <Link className="card today-drill" to={itemPath('transition', drill.technique.id)}>
          <PositionArtwork
            id={drill.technique.fromId}
            name={lib.positionById.get(drill.technique.fromId)?.name ?? ''}
            className="thumb-artwork"
          />
          <span className="grow">
            <span className="eyebrow">Drill for today</span>
            <strong>{drill.technique.name}</strong>
            <span className="muted small block">{DRILL_REASON_TEXT[drill.reason]}</span>
            <span className="small block">{drill.drill}</span>
          </span>
          <Icon name="chevron" />
        </Link>
      )}

      <section className="card">
        {training.classes === 0 ? (
          <>
            <p className="eyebrow">Training log</p>
            <p className="muted">
              Write up each class while it is fresh: what was taught, what worked in rolling, and one thing to work on
              next time.
            </p>
            <Link className="button" to={ROUTES.log}>
              Log a class
            </Link>
          </>
        ) : (
          <>
            <p className="eyebrow">{training.focus ? 'Focus for your next class' : 'Training log'}</p>
            {training.focus && <p className="today-focus">{training.focus}</p>}
            <p className="muted small">
              {formatClassCount(training.classes)} logged · {formatMatTime(training.minutes)} on the mat
            </p>
            {stuck.length > 0 && (
              <>
                <p className="muted small">
                  Where you got stuck. Cards from here that you have not studied yet come first in review.
                </p>
                <ul className="chip-list">
                  {stuck.map((situation) => (
                    <li key={`${situation.position.id}:${situation.role}`}>
                      <Link className="chip" to={positionSidePath(situation.position.id, situation.role)}>
                        {situationName(situation)}
                        <Icon name="chevron" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section className="card today-rank" aria-label="Study rank">
        <Belt rank={rank.belt} stripes={rank.stripes} />
        <div className="grow">
          <p>
            <strong>{BELT_LABELS[rank.belt]}</strong> of the fundamentals
          </p>
          <ProgressBar value={progress.learned} max={progress.total} label="Learned" />
          <p className="muted small">
            {progress.learned} of {progress.total} learned
            {rank.nextBelt
              ? ` · ${rank.percentToNextBelt}% more for ${BELT_LABELS[rank.nextBelt].toLowerCase()}. A study rank, not a real one.`
              : '. Keep reviewing to stay sharp.'}
          </p>
        </div>
      </section>

      <section className="card">
        <LibrarySearch lib={lib} />
      </section>

      <section className="card">
        <h2>Suggested path</h2>
        <PathSteps steps={steps} />
      </section>

      {sticking.length > 0 && (
        <section className="card">
          <h2>Sticking points</h2>
          <p className="muted">
            These have slipped more than once in review. Reread the page or watch the video, then try one in your next
            class.
          </p>
          <ul className="chip-list">
            {sticking.map((item) => (
              <li key={`${item.kind}:${item.id}`}>
                <Link to={studyItemPath(item)} className="chip">
                  <ProgressDot state={reviewOf(lib, item.kind, item.id)} /> {cardName(lib, item)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="section-head">
          <h2>Concepts to learn next</h2>
          <Link className="button small" to={ROUTES.concepts}>
            All {lib.concepts.length} concepts
          </Link>
        </div>
        {nextConcepts.length === 0 ? (
          <p className="muted">
            {lib.concepts.length === 0 ? 'No concepts yet.' : 'Every concept is learned. Keep reviewing to stay sharp.'}
          </p>
        ) : (
          <ul className="chip-list stagger">
            {nextConcepts.map((c) => (
              <li key={c.id}>
                <Link to={itemPath('concept', c.id)} className="chip">
                  <ProgressDot state={reviewOf(lib, 'concept', c.id)} /> {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
