import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { CATEGORY_LABELS, roleLabel } from '../../core/labels';
import { connections, reviewOf } from '../../core/library';
import { POSITION_ROLES, type PositionRole } from '../../core/models';
import { positionOptions } from '../../core/roles';
import { roleGoals } from '../../core/situations';
import { positionProgress } from '../../core/todaysDrill';
import { Bullets, Loading, Missing, NotesBlock, Pager, Section, StudyStatusPill } from '../components/common';
import { ItemPicture } from '../components/ItemPicture';
import { NO_TECHNIQUES_FROM_HERE, TransitionList } from '../components/TransitionLink';
import { LinkedVideos } from '../components/VideoList';
import { PositionArtwork } from '../graphics/PositionSvg';
import { editPath, itemPath, newItemPath, ROUTES, SIDE_PARAM } from '../routes';

/** The side a position's page opens on when the link does not say. */
const DEFAULT_SIDE: PositionRole = 'top';

export default function PositionDetail() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const lib = useLibrary();
  // A link from the log or Today can open the page on the side the student was stuck on.
  const [side, setSide] = useState<PositionRole>(
    () => POSITION_ROLES.find((role) => role === params.get(SIDE_PARAM)) ?? DEFAULT_SIDE,
  );
  if (!lib) return <Loading />;
  const position = lib.positionById.get(id);
  if (!position) return <Missing what="Position" back={{ to: ROUTES.positions, label: 'Positions' }} />;

  const { outgoing, incoming } = connections(lib, position.id);
  const options = positionOptions(lib, position.id);
  const progress = positionProgress(lib, position.id);
  const concepts = position.conceptIds.map((c) => lib.conceptById.get(c)).filter((c) => c !== undefined);
  const index = lib.positions.findIndex((p) => p.id === position.id);
  const previous = lib.positions[index - 1];
  const next = lib.positions[index + 1];

  return (
    <article className="stack">
      <Link to={ROUTES.positions} className="small">
        ← Positions
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {CATEGORY_LABELS[position.category]} <StudyStatusPill state={reviewOf(lib, 'position', position.id)} />
          </p>
          <h1>{position.name}</h1>
          <p className="lead">{position.summary}</p>
        </div>
        <Link className="button small" to={editPath('position', position.id)}>
          Edit
        </Link>
      </div>
      <div className="card">
        <ItemPicture kind="position" id={position.id}>
          <PositionArtwork id={position.id} name={position.name} />
        </ItemPicture>
        {/* One side at a time: in a roll you are only ever on one of them. */}
        <fieldset className="segmented side-switch" aria-label="Which side you are on">
          {POSITION_ROLES.map((role) => (
            <button key={role} type="button" aria-pressed={side === role} onClick={() => setSide(role)}>
              {roleLabel(position.category, role)}
            </button>
          ))}
        </fieldset>
        <Section title="What you want">
          <Bullets items={roleGoals(position, side)} />
        </Section>
        <Section
          title="What you can do"
          action={
            <Link className="button small" to={newItemPath('transition', position.id)}>
              + Technique
            </Link>
          }
        >
          {progress.total > 0 && (
            <p className="muted small">
              {progress.learned} of {progress.total} learned from this position
            </p>
          )}
          {outgoing.length === 0 ? (
            <p className="muted">{NO_TECHNIQUES_FROM_HERE}</p>
          ) : options[side].length > 0 ? (
            <TransitionList transitions={options[side]} positionById={lib.positionById} direction="out" />
          ) : (
            <p className="muted">Nothing for this side yet. Add a technique so you have an answer here.</p>
          )}
        </Section>
        {concepts.length > 0 && (
          <Section title="Concepts to remember">
            <ul className="chip-list">
              {concepts.map((c) => (
                <li key={c.id}>
                  <Link className="chip" to={itemPath('concept', c.id)}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {incoming.length > 0 && (
          <Section title="Ways to get here">
            <TransitionList transitions={incoming} positionById={lib.positionById} direction="in" />
          </Section>
        )}
        <NotesBlock notes={position.notes} />
        <LinkedVideos kind="position" id={position.id} />
      </div>
      <Pager
        previous={previous && { to: itemPath('position', previous.id), label: previous.name }}
        next={next && { to: itemPath('position', next.id), label: next.name }}
      />
    </article>
  );
}
