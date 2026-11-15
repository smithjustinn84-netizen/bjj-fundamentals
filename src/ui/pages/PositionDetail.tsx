import { Link, useParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { CATEGORY_LABELS, ROLE_LABELS } from '../../core/labels';
import { connections, reviewOf } from '../../core/library';
import { Bullets, Loading, Missing, NotesBlock, Pager, Section, StudyStatusPill } from '../components/common';
import { NO_TECHNIQUES_FROM_HERE, TransitionList } from '../components/TransitionLink';
import { LinkedVideos } from '../components/VideoList';
import { PositionArtwork } from '../graphics/PositionSvg';
import { editPath, itemPath, newItemPath, ROUTES } from '../routes';

export default function PositionDetail() {
  const { id = '' } = useParams();
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const position = lib.positionById.get(id);
  if (!position) return <Missing what="Position" back={{ to: ROUTES.positions, label: 'Position map' }} />;

  const [top, bottom] = ROLE_LABELS[position.category];
  const { outgoing, incoming } = connections(lib, position.id);
  const concepts = position.conceptIds.map((c) => lib.conceptById.get(c)).filter((c) => c !== undefined);
  const index = lib.positions.findIndex((p) => p.id === position.id);
  const previous = lib.positions[index - 1];
  const next = lib.positions[index + 1];

  return (
    <article className="stack">
      <Link to={ROUTES.positions} className="small">
        ← Position map
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
        <PositionArtwork id={position.id} name={position.name} />
        <div className="two-col">
          <Section title={top}>
            <Bullets items={position.topGoals} />
          </Section>
          <Section title={bottom}>
            <Bullets items={position.bottomGoals} />
          </Section>
        </div>
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
        <Section
          title="From here"
          action={
            <Link className="button small" to={newItemPath('transition', position.id)}>
              + Technique
            </Link>
          }
        >
          {outgoing.length > 0 ? (
            <TransitionList transitions={outgoing} positionById={lib.positionById} direction="out" />
          ) : (
            <p className="muted">{NO_TECHNIQUES_FROM_HERE}</p>
          )}
        </Section>
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
