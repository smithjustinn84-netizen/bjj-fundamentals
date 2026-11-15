import { Link } from 'react-router-dom';
import { items, useLibrary, useMissingStarterTechniques } from '../../bindings';
import { blueBeltTestList } from '../../core/beltTest';
import { TRANSITION_GROUP_LABELS } from '../../core/labels';
import { reviewOf } from '../../core/library';
import { Loading, ProgressDot, ProgressLegend } from '../components/common';
import { LearnTabs } from '../components/LearnTabs';
import { StarterOffer } from '../components/StarterOffer';
import { Belt } from '../graphics/Belt';
import { EmptyState } from '../graphics/EmptyState';
import { Icon } from '../graphics/icons';
import { ProgressBar } from '../graphics/ProgressBar';
import { itemPath, newItemPath, ROUTES, reviewPath } from '../routes';

export default function BlueBelt() {
  const lib = useLibrary();
  const missing = useMissingStarterTechniques();
  if (!lib) return <Loading />;
  const list = blueBeltTestList(lib);

  return (
    <div className="stack">
      <LearnTabs />
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
      <StarterOffer
        noun="technique"
        names={missing?.map((technique) => technique.name)}
        onAdd={items.addMissingStarterTechniques}
        onDismiss={items.dismissMissingStarterTechniques}
      />
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
            <Link className="button primary" to={reviewPath('blueBelt')}>
              Study techniques
            </Link>
          </div>
          <ProgressLegend />
          {list.groups.map((group) => (
            <section key={group.type}>
              <h2 className="group-title">
                {TRANSITION_GROUP_LABELS[group.type]} <span className="muted small">{group.techniques.length}</span>
              </h2>
              <ul className="transition-list card belt-test-list">
                {group.techniques.map((technique) => {
                  const from = lib.positionById.get(technique.fromId);
                  return (
                    <li key={technique.id}>
                      <Link className="row-link" to={itemPath('transition', technique.id)}>
                        <ProgressDot state={reviewOf(lib, 'transition', technique.id)} />
                        <span className="row-text">
                          <span className="row-name">{technique.name}</span>
                          {from && <span className="row-meta">from {from.name}</span>}
                        </span>
                        <Icon name="chevron" />
                      </Link>
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
