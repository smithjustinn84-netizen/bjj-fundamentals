import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { CATEGORY_LABELS } from '../../core/labels';
import { connections, type Library, reviewOf } from '../../core/library';
import { POSITION_CATEGORIES } from '../../core/models';
import { Loading, ProgressDot } from '../components/common';
import { PositionMap } from '../components/PositionMap';
import { NO_TECHNIQUES_FROM_HERE, TransitionList } from '../components/TransitionLink';
import { EmptyState } from '../graphics/EmptyState';
import { Icon, type IconName } from '../graphics/icons';
import { useMediaQuery } from '../graphics/motion';
import { PositionArtwork } from '../graphics/PositionSvg';
import { itemPath, newItemPath } from '../routes';

/**
 * The across-the-page map needs about the full content column to stay readable.
 * On anything narrower it runs down the page instead. Matches the breakpoint in map.css.
 */
const NARROW_SCREEN = '(max-width: 999px)';

const VIEWS = ['map', 'list'] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABELS: Record<View, { label: string; icon: IconName }> = {
  map: { label: 'Map', icon: 'map' },
  list: { label: 'List', icon: 'list' },
};

/** Every position as a card, grouped by category, with the techniques that leave it. */
function PositionList({ lib }: { lib: Library }) {
  return (
    <>
      {POSITION_CATEGORIES.map((category) => {
        const inCategory = lib.positions.filter((p) => p.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="group-title">{CATEGORY_LABELS[category]}</h2>
            <div className="grid stagger">
              {inCategory.map((p) => {
                const { outgoing } = connections(lib, p.id);
                return (
                  <article key={p.id} className="card position-card">
                    <PositionArtwork id={p.id} name={p.name} className="card-artwork" />
                    <h3>
                      <ProgressDot state={reviewOf(lib, 'position', p.id)} />{' '}
                      <Link to={itemPath('position', p.id)}>{p.name}</Link>
                    </h3>
                    <p className="muted small">{p.summary}</p>
                    {outgoing.length > 0 ? (
                      <TransitionList transitions={outgoing} positionById={lib.positionById} direction="out" />
                    ) : (
                      <p className="muted small">{NO_TECHNIQUES_FROM_HERE}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

export default function Positions() {
  const lib = useLibrary();
  const [view, setView] = useState<View>('map');
  const narrow = useMediaQuery(NARROW_SCREEN);
  if (!lib) return <Loading />;
  const orphans = lib.transitions.filter((t) => !lib.positionById.has(t.fromId));

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Position map</h1>
          <p className="muted">Each position, and the techniques that move you between them.</p>
        </div>
        <div className="row">
          <fieldset className="segmented" aria-label="View">
            {VIEWS.map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}>
                <Icon name={VIEW_LABELS[option].icon} />
                {VIEW_LABELS[option].label}
              </button>
            ))}
          </fieldset>
          <Link className="button" to={newItemPath('position')}>
            + Position
          </Link>
          <Link className="button" to={newItemPath('transition')}>
            + Technique
          </Link>
        </div>
      </div>
      {lib.positions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="map"
            title="No positions yet"
            action={
              <Link className="button primary" to={newItemPath('position')}>
                Add a position
              </Link>
            }
          >
            Add a position, then the techniques that connect it to others, and the map will draw itself.
          </EmptyState>
        </div>
      ) : view === 'map' ? (
        <PositionMap lib={lib} orientation={narrow ? 'vertical' : 'horizontal'} />
      ) : (
        <PositionList lib={lib} />
      )}
      {orphans.length > 0 && (
        <section>
          <h2 className="group-title">Techniques without a starting position</h2>
          <TransitionList transitions={orphans} positionById={lib.positionById} direction="out" className="card" />
        </section>
      )}
    </div>
  );
}
