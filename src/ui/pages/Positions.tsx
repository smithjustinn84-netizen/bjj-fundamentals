import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { CATEGORY_LABELS } from '../../core/labels';
import { type Library, reviewOf } from '../../core/library';
import { POSITION_CATEGORIES } from '../../core/models';
import { positionProgress } from '../../core/todaysDrill';
import { TABLET_UP } from '../breakpoints';
import { Loading, ProgressDot, ProgressLegend } from '../components/common';
import { LearnTabs } from '../components/LearnTabs';
import { LibrarySearch } from '../components/LibrarySearch';
import { PositionMap } from '../components/PositionMap';
import { NO_TECHNIQUES_FROM_HERE, TransitionList } from '../components/TransitionLink';
import { EmptyState } from '../graphics/EmptyState';
import { Icon, type IconName } from '../graphics/icons';
import { PositionArtwork } from '../graphics/PositionSvg';
import { itemPath, newItemPath } from '../routes';
import { useMediaQuery } from '../useMediaQuery';

/**
 * The across-the-page map needs a column about 1000px wide to stay readable. Beside the side rail
 * (`--rail-width`) the window is that roomy from here; narrower, the map runs down the page instead.
 */
const MAP_ACROSS = '(min-width: 1280px)';

const VIEWS = ['list', 'map'] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABELS: Record<View, { label: string; icon: IconName }> = {
  map: { label: 'Map', icon: 'map' },
  list: { label: 'List', icon: 'list' },
};

/** Every position as a row, grouped by category: its picture, its name and how much of it is learned. */
function PositionList({ lib }: { lib: Library }) {
  return (
    <>
      {POSITION_CATEGORIES.map((category) => {
        const inCategory = lib.positions.filter((p) => p.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="group-title">{CATEGORY_LABELS[category]}</h2>
            <ul className="tile-list position-tiles stagger">
              {inCategory.map((p) => {
                const progress = positionProgress(lib, p.id);
                return (
                  <li key={p.id}>
                    <Link to={itemPath('position', p.id)} className="tile">
                      <PositionArtwork id={p.id} name={p.name} className="thumb-artwork" />
                      <span className="grow">
                        <strong>{p.name}</strong>
                        <span className="muted small block">
                          {progress.total > 0
                            ? `${progress.learned} of ${progress.total} techniques learned`
                            : NO_TECHNIQUES_FROM_HERE}
                        </span>
                      </span>
                      <ProgressDot state={reviewOf(lib, 'position', p.id)} />
                      <Icon name="chevron" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export default function Positions() {
  const lib = useLibrary();
  const roomForMap = useMediaQuery(TABLET_UP);
  /** Null until the user picks a view; until then the screen decides: the map is hard to read on a phone. */
  const [chosenView, setView] = useState<View | null>(null);
  const view = chosenView ?? (roomForMap ? 'map' : 'list');
  const across = useMediaQuery(MAP_ACROSS);
  if (!lib) return <Loading />;
  const orphans = lib.transitions.filter((t) => !lib.positionById.has(t.fromId));

  return (
    <div className="stack">
      <LearnTabs />
      <div className="page-head">
        <div>
          <h1>Positions</h1>
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
      <div className="card">
        <LibrarySearch lib={lib} />
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
        <PositionMap lib={lib} orientation={across ? 'horizontal' : 'vertical'} />
      ) : (
        <>
          <ProgressLegend />
          <PositionList lib={lib} />
        </>
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
