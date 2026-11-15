import { Link } from 'react-router-dom';
import { items, useLibrary, useMissingStarterTechniques } from '../../bindings';
import { blueBeltTestList } from '../../core/beltTest';
import { TRANSITION_GROUP_LABELS } from '../../core/labels';
import { cardId } from '../../core/srs';
import { Loading, ProgressDot } from '../components/common';
import { Belt } from '../graphics/Belt';
import { EmptyState } from '../graphics/EmptyState';
import { ProgressBar } from '../graphics/ProgressBar';
import { itemPath, newItemPath, ROUTES } from '../routes';

/** Offers starter techniques that were added to the app after this library was set up. */
function MissingStarterTechniques() {
  const missing = useMissingStarterTechniques();
  if (!missing || missing.length === 0) return null;
  return (
    <div className="card stack">
      <p>
        <strong>
          {missing.length} starter {missing.length === 1 ? 'technique is' : 'techniques are'} not in your library:
        </strong>{' '}
        {missing.map((technique) => technique.name).join(', ')}.
      </p>
      <div className="row">
        <button type="button" className="primary" onClick={() => void items.addMissingStarterTechniques()}>
          Add {missing.length === 1 ? 'it' : 'them'}
        </button>
      </div>
    </div>
  );
}

export default function BlueBelt() {
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const list = blueBeltTestList(lib);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Blue belt test</h1>
          <p className="muted">
            The techniques you will be asked to show. Every gym tests differently, so edit a technique to add it to this
            list or take it off.
          </p>
        </div>
        <Link className="button" to={newItemPath('transition')}>
          + Technique
        </Link>
      </div>
      <MissingStarterTechniques />
      {list.total === 0 ? (
        <div className="card">
          <EmptyState
            icon="belt"
            title="Nothing on the list yet"
            action={
              <Link className="button primary" to={ROUTES.positions}>
                Browse techniques
              </Link>
            }
          >
            Open a technique, choose Edit and tick “On the blue belt test” to add it here.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="card belt-test-summary">
            <Belt rank="blue" stripes={0} />
            <div className="grow">
              <p>
                <strong>
                  {list.learned} of {list.total}
                </strong>{' '}
                learned
              </p>
              <ProgressBar value={list.learned} max={list.total} label="Blue belt techniques learned" />
            </div>
          </div>
          {list.groups.map((group) => (
            <section key={group.type}>
              <h2 className="group-title">
                {TRANSITION_GROUP_LABELS[group.type]} <span className="muted small">{group.techniques.length}</span>
              </h2>
              <ul className="transition-list card belt-test-list">
                {group.techniques.map((technique) => {
                  const from = lib.positionById.get(technique.fromId);
                  return (
                    <li key={technique.id} className="transition-row">
                      <ProgressDot state={lib.reviews.get(cardId('transition', technique.id))} />
                      <Link to={itemPath('transition', technique.id)}>{technique.name}</Link>
                      {from && <span className="muted small">from {from.name}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
