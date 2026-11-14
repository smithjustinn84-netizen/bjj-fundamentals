import { Link, useNavigate, useParams } from 'react-router-dom';
import { items, useLibrary } from '../../bindings';
import { CATEGORY_LABELS, ROLE_LABELS } from '../../core/labels';
import { cardId } from '../../core/srs';
import { Bullets, Loading, Missing, NotesBlock, ProgressDot, Section } from '../components/common';
import { TransitionLink } from '../components/TransitionLink';
import { LinkedVideos } from '../components/VideoList';
import { PositionArtwork } from '../graphics/PositionSvg';
import { editPath, itemPath, newItemPath, ROUTES } from '../routes';

export default function PositionDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const position = lib.positionById.get(id);
  if (!position) return <Missing what="Position" back={{ to: ROUTES.positions, label: 'Position map' }} />;

  const [top, bottom] = ROLE_LABELS[position.category];
  const outgoing = lib.transitions.filter((t) => t.fromId === position.id);
  const incoming = lib.transitions.filter((t) => t.toId === position.id && t.fromId !== position.id);
  const concepts = position.conceptIds.map((c) => lib.conceptById.get(c)).filter((c) => c !== undefined);

  const remove = async () => {
    const connected = outgoing.length + incoming.length;
    const warning = connected
      ? ` This also deletes ${connected} technique${connected === 1 ? '' : 's'} connected to it.`
      : '';
    if (!confirm(`Delete "${position.name}"?${warning}`)) return;
    await items.deleteItem('position', position.id);
    navigate(ROUTES.positions);
  };

  return (
    <article className="stack">
      <Link to={ROUTES.positions} className="small">
        ← Position map
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {CATEGORY_LABELS[position.category]}{' '}
            <ProgressDot state={lib.reviews.get(cardId('position', position.id))} />
          </p>
          <h1>{position.name}</h1>
          <p className="lead">{position.summary}</p>
        </div>
        <div className="row">
          <Link className="button" to={editPath('position', position.id)}>
            Edit
          </Link>
          <button type="button" className="danger" onClick={remove}>
            Delete
          </button>
        </div>
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
            <ul className="transition-list">
              {outgoing.map((t) => (
                <TransitionLink key={t.id} transition={t} positionById={lib.positionById} direction="out" />
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing yet.</p>
          )}
        </Section>
        {incoming.length > 0 && (
          <Section title="Ways to get here">
            <ul className="transition-list">
              {incoming.map((t) => (
                <TransitionLink key={t.id} transition={t} positionById={lib.positionById} direction="in" />
              ))}
            </ul>
          </Section>
        )}
        <NotesBlock notes={position.notes} />
        <LinkedVideos kind="position" id={position.id} />
      </div>
    </article>
  );
}
