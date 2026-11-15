import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary, useStudyStats, useTrainingLog, useVideos } from '../../bindings';
import { BELT_LABELS } from '../../core/labels';
import { reviewOf } from '../../core/library';
import { beltRank } from '../../core/rank';
import { findSituation, situationName } from '../../core/situations';
import { cardId } from '../../core/srs';
import { cardName, progressSummary, STICKING_POINT_LIMIT, stickingPoints } from '../../core/study';
import { type DrillReason, pickDrill } from '../../core/todaysDrill';
import { formatClassCount, formatMatTime, trainingSummary } from '../../core/trainingLog';
import { Loading, ProgressDot } from '../components/common';
import { LibrarySearch } from '../components/LibrarySearch';
import { ArtworkFrame, HERO_DOJO_ARTWORK } from '../graphics/Artwork';
import { Belt } from '../graphics/Belt';
import { Icon, type IconName } from '../graphics/icons';
import { ProgressRing } from '../graphics/ProgressRing';
import { useCountUp } from '../graphics/useCountUp';
import { itemPath, ROUTES, studyItemPath } from '../routes';

function reviewButtonLabel(dueCount: number, started: number): string {
  if (dueCount > 0) return `Review ${dueCount} card${dueCount === 1 ? '' : 's'}`;
  return started === 0 ? 'Start studying' : 'Study new cards';
}

/** Why today's drill was chosen, said to the student. */
const DRILL_REASON_TEXT: Record<DrillReason, string> = {
  stuck: 'A way out of where you got stuck last class.',
  slipping: 'This one keeps slipping in review.',
  practised: 'You practised this in a recent class.',
  next: 'The next technique you have not learned yet.',
};

function StatTile({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  const shown = useCountUp(value);
  return (
    <div className="stat-tile">
      <Icon name={icon} />
      <span className="stat">{shown}</span>
      <span className="muted small">{label}</span>
    </div>
  );
}

function LearnedRing({ percent, learned, total }: { percent: number; learned: number; total: number }) {
  const shown = useCountUp(percent);
  return (
    <ProgressRing percent={percent} label="Learned">
      <span className="stat">{shown}%</span>
      <span className="muted small">
        {learned}/{total} learned
      </span>
    </ProgressRing>
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
  const stuck = training.stuckIds.map((id) => findSituation(lib, id)).filter((situation) => situation !== null);

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
      <section className="hero card">
        <ArtworkFrame
          src={HERO_DOJO_ARTWORK}
          alt="Sunlit tatami mat room with a folded white gi and black belt"
          className="hero-artwork"
          eager
        />
        <div className="hero-text">
          <p className="eyebrow">Your training</p>
          <h1>Learn the fundamentals, one idea at a time</h1>
          <p className="muted">
            Start with the core concepts, then see how they show up in each position. Short daily reviews will help them
            stick.
          </p>
          <div className="row">
            <Link className="button primary" to={ROUTES.review}>
              {reviewButtonLabel(stats.dueCount, progress.started)}
              <Icon name="arrow" />
            </Link>
            <Link className="button" to={ROUTES.concepts}>
              Browse concepts
            </Link>
            {/* The phone tab bar has no room for the log, so the hero carries the way in. */}
            <Link className="button" to={ROUTES.log}>
              Log a class
            </Link>
          </div>
        </div>
        <div className="hero-rank">
          <LearnedRing percent={progress.percentLearned} learned={progress.learned} total={progress.total} />
          <Belt rank={rank.belt} stripes={rank.stripes} />
          <p className="rank-label">
            <strong>{BELT_LABELS[rank.belt]}</strong> of the fundamentals
            <span className="muted small block">
              {rank.nextBelt
                ? `Learn ${rank.percentToNextBelt}% more for your ${BELT_LABELS[rank.nextBelt].toLowerCase()}. A study rank, not a real one.`
                : 'Everything learned. Keep reviewing to stay sharp.'}
            </span>
          </p>
        </div>
        {/* Before the first review both numbers are zero, which tells a newcomer nothing. */}
        {progress.started > 0 && (
          <div className="stat-tiles">
            <StatTile icon="review" value={stats.dueCount} label="due now" />
            <StatTile icon="flame" value={stats.streakDays} label="day streak" />
          </div>
        )}
      </section>

      <section className="card">
        <LibrarySearch lib={lib} />
      </section>

      {drill && (
        <section className="card">
          <h2>Drill for today</h2>
          <p>
            <Link to={itemPath('transition', drill.technique.id)}>{drill.technique.name}</Link>
            <span className="muted"> · {DRILL_REASON_TEXT[drill.reason]}</span>
          </p>
          <p className="drill">{drill.drill}</p>
        </section>
      )}

      <section className="card">
        <div className="section-head">
          <h2>Training log</h2>
          <Link className="button small" to={ROUTES.log}>
            {training.classes === 0 ? 'Log a class' : 'Open the log'}
          </Link>
        </div>
        {training.classes === 0 ? (
          <p className="muted">
            Write up each class while it is fresh: what was taught, what worked in rolling, and one thing to work on
            next time.
          </p>
        ) : (
          <>
            <p className="muted">
              {formatClassCount(training.classes)} logged · {formatMatTime(training.minutes)} on the mat
            </p>
            {training.focus && (
              <p>
                <strong>Focus for your next class:</strong> {training.focus}
              </p>
            )}
            {stuck.length > 0 && (
              <p>
                <strong>Where you got stuck:</strong>{' '}
                {stuck.map((situation, index) => (
                  <span key={`${situation.position.id}:${situation.role}`}>
                    {index > 0 && '; '}
                    <Link to={itemPath('position', situation.position.id)}>{situationName(situation)}</Link>
                  </span>
                ))}
                . These come first in your next review.
              </p>
            )}
          </>
        )}
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
        <h2>Concepts</h2>
        {lib.concepts.length === 0 && <p className="muted">No concepts yet.</p>}
        <ul className="chip-list stagger">
          {lib.concepts.map((c) => (
            <li key={c.id}>
              <Link to={itemPath('concept', c.id)} className="chip">
                <ProgressDot state={reviewOf(lib, 'concept', c.id)} /> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
