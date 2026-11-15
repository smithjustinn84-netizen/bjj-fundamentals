import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { CATEGORY_LABELS } from '../../core/labels';
import { type Library, reviewOf } from '../../core/library';
import { POSITION_CATEGORIES } from '../../core/models';
import { positionProgress } from '../../core/todaysDrill';
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
 * The across-the-page map needs about the full content column to stay readable, so below the
 * column's `max-width` in shell.css (1000px) it runs down the page instead.
 */
const NARROW_SCREEN = '(max-width: 999px)';

/** The phone breakpoint in shell.css. The map is hard to read that narrow, so a phone opens on the list. */
const PHONE_SCREEN = '(max-width: 599px)';

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
  const onPhone = useMediaQuery(PHONE_SCREEN);
  /** Null until the user picks a view; until then the screen decides. */
  const [chosenView, setView] = useState<View | null>(null);
  const view = chosenView ?? (onPhone ? 'list' : 'map');
  const narrow = useMediaQuery(NARROW_SCREEN);
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
        <PositionMap lib={lib} orientation={narrow ? 'vertical' : 'horizontal'} />
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
