import { Link } from 'react-router-dom';
import { useLibrary } from '../../data';
import { CATEGORY_LABELS } from '../../domain/labels';
import { cardId } from '../../domain/srs';
import { POSITION_CATEGORIES } from '../../domain/types';
import { Loading, ProgressDot } from '../components/common';
import { TransitionLink } from '../components/TransitionLink';
import { itemPath, newItemPath } from '../routes';

export default function Positions() {
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const orphans = lib.transitions.filter((t) => !lib.positionById.has(t.fromId));

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Position map</h1>
          <p className="muted">Each position, and the techniques that move you out of it.</p>
        </div>
        <div className="row">
          <Link className="button" to={newItemPath('position')}>
            + Position
          </Link>
          <Link className="button" to={newItemPath('transition')}>
            + Technique
          </Link>
        </div>
      </div>
      {POSITION_CATEGORIES.map((category) => {
        const inCategory = lib.positions.filter((p) => p.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="group-title">{CATEGORY_LABELS[category]}</h2>
            <div className="grid">
              {inCategory.map((p) => {
                const outgoing = lib.transitions.filter((t) => t.fromId === p.id);
                return (
                  <article key={p.id} className="card position-card">
                    <h3>
                      <ProgressDot state={lib.reviews.get(cardId('position', p.id))} />{' '}
                      <Link to={itemPath('position', p.id)}>{p.name}</Link>
                    </h3>
                    <p className="muted small">{p.summary}</p>
                    {outgoing.length > 0 ? (
                      <ul className="transition-list">
                        {outgoing.map((t) => (
                          <TransitionLink key={t.id} transition={t} positionById={lib.positionById} direction="out" />
                        ))}
                      </ul>
                    ) : (
                      <p className="muted small">No techniques from here yet.</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      {orphans.length > 0 && (
        <section>
          <h2 className="group-title">Techniques without a starting position</h2>
          <ul className="transition-list card">
            {orphans.map((t) => (
              <TransitionLink key={t.id} transition={t} positionById={lib.positionById} direction="out" />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
