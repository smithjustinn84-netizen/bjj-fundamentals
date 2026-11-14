import { Link } from 'react-router-dom';
import { useLibrary, useStudyStats } from '../../bindings';
import { cardId } from '../../core/srs';
import { progressSummary } from '../../core/study';
import { Loading, ProgressDot } from '../components/common';
import { itemPath, ROUTES } from '../routes';

function reviewButtonLabel(dueCount: number, started: number): string {
  if (dueCount > 0) return `Review ${dueCount} card${dueCount === 1 ? '' : 's'}`;
  return started === 0 ? 'Start studying' : 'Study new cards';
}

export default function Home() {
  const lib = useLibrary();
  const stats = useStudyStats();
  if (!lib || !stats) return <Loading />;

  const progress = progressSummary(lib);
  const nextConcept = lib.concepts.find((c) => !lib.reviews.has(cardId('concept', c.id)));
  const nextPosition = lib.positions.find((p) => !lib.reviews.has(cardId('position', p.id)));

  return (
    <div className="stack">
      <section className="hero card">
        <h1>Learn the fundamentals, one idea at a time</h1>
        <p className="muted">
          Start with the core concepts, then see how they show up in each position. Short daily reviews will help them
          stick.
        </p>
        <div className="stats">
          <div>
            <span className="stat">{stats.dueCount}</span>
            <span className="muted">due now</span>
          </div>
          <div>
            <span className="stat">{stats.streakDays}</span>
            <span className="muted">day streak</span>
          </div>
          <div>
            <span className="stat">{progress.percentLearned}%</span>
            <span className="muted">
              learned ({progress.learned}/{progress.total})
            </span>
          </div>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progress.percentLearned}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Learned"
        >
          <div style={{ width: `${progress.percentLearned}%` }} />
        </div>
        <div className="row">
          <Link className="button primary" to={ROUTES.review}>
            {reviewButtonLabel(stats.dueCount, progress.started)}
          </Link>
          <Link className="button" to={ROUTES.concepts}>
            Browse concepts
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>Suggested path</h2>
        <ol className="path">
          <li>
            <strong>Core concepts.</strong> Posture, base, frames, and the shrimp show up everywhere.
            {nextConcept && (
              <>
                {' '}
                Next up: <Link to={itemPath('concept', nextConcept.id)}>{nextConcept.name}</Link>.
              </>
            )}
          </li>
          <li>
            <strong>The main positions.</strong> Know what each person wants in each one.
            {nextPosition && (
              <>
                {' '}
                Next up: <Link to={itemPath('position', nextPosition.id)}>{nextPosition.name}</Link>.
              </>
            )}
          </li>
          <li>
            <strong>How positions connect.</strong> Sweeps, passes, and escapes move you between them. See the{' '}
            <Link to={ROUTES.positions}>position map</Link>.
          </li>
          <li>
            <strong>Save the best explanations.</strong> Bookmark the exact moment in a YouTube video on any item.
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Concepts</h2>
        <ul className="chip-list">
          {lib.concepts.map((c) => (
            <li key={c.id}>
              <Link to={itemPath('concept', c.id)} className="chip">
                <ProgressDot state={lib.reviews.get(cardId('concept', c.id))} /> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
