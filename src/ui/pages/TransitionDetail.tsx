import { Link, useParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { isOnBlueBeltTest } from '../../core/beltTest';
import { endSideLabel, roleLabel, TRANSITION_LABELS } from '../../core/labels';
import { connections, reviewOf } from '../../core/library';
import { endsTheRoll } from '../../core/models';
import { endRole, performerRole } from '../../core/roles';
import { techniqueDrill } from '../../core/techniqueDrill';
import { Bullets, Loading, Missing, NotesBlock, Pager, Section, StudyStatusPill } from '../components/common';
import { ItemPicture } from '../components/ItemPicture';
import { LinkedVideos } from '../components/VideoList';
import { TransitionArtwork } from '../graphics/Artwork';
import { editPath, itemPath, ROUTES } from '../routes';

export default function TransitionDetail() {
  const { id = '' } = useParams();
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const transition = lib.transitionById.get(id);
  if (!transition) return <Missing what="Technique" back={{ to: ROUTES.positions, label: 'Positions' }} />;

  const from = lib.positionById.get(transition.fromId);
  const to = lib.positionById.get(transition.toId);
  const drill = techniqueDrill(transition);
  const endSide = endRole(lib, transition);
  const backPath = from ? itemPath('position', from.id) : ROUTES.positions;
  // Paging stays among the techniques that start where this one does, the way the position page lists them.
  const siblings = from ? connections(lib, from.id).outgoing : [];
  const index = siblings.findIndex((t) => t.id === transition.id);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];

  return (
    <article className="stack">
      <Link to={backPath} className="small">
        ← {from ? from.name : 'Positions'}
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            <span className={`tag tag-${transition.type}`}>{TRANSITION_LABELS[transition.type]}</span>{' '}
            {isOnBlueBeltTest(transition) && (
              <>
                <Link className="tag tag-blue-belt" to={ROUTES.blueBelt}>
                  Blue belt test
                </Link>{' '}
              </>
            )}
            <StudyStatusPill state={reviewOf(lib, 'transition', transition.id)} />
          </p>
          <h1>{transition.name}</h1>
          <p className="route">
            {from ? <Link to={itemPath('position', from.id)}>{from.name}</Link> : <span className="muted">?</span>}
            <span aria-hidden="true"> → </span>
            {endsTheRoll(transition.type) ? (
              <strong>Tap</strong>
            ) : to ? (
              <Link to={itemPath('position', to.id)}>{to.name}</Link>
            ) : (
              <span className="muted">?</span>
            )}
          </p>
          {from && (
            <p className="muted small">
              Who does it: <strong>{roleLabel(from.category, performerRole(lib, transition))}</strong>
              {to && endSide && (
                <>
                  {' · '}You end up: <strong>{endSideLabel(to.category, endSide)}</strong>
                </>
              )}
            </p>
          )}
        </div>
        <Link className="button small" to={editPath('transition', transition.id)}>
          Edit
        </Link>
      </div>
      <div className="card">
        <ItemPicture kind="transition" id={transition.id}>
          <TransitionArtwork transition={transition} positionById={lib.positionById} />
        </ItemPicture>
        <Section title="Steps">
          <Bullets items={transition.steps} ordered />
        </Section>
        {transition.commonMistakes.length > 0 && (
          <Section title="Common mistakes">
            <Bullets items={transition.commonMistakes} />
          </Section>
        )}
        {drill && (
          <Section title="Try this drill">
            <p>{drill}</p>
          </Section>
        )}
        {endsTheRoll(transition.type) && (
          <p className="drill">Apply submissions slowly in training and let go as soon as your partner taps.</p>
        )}
        <NotesBlock notes={transition.notes} />
        <LinkedVideos kind="transition" id={transition.id} />
      </div>
      <Pager
        previous={previous && { to: itemPath('transition', previous.id), label: previous.name }}
        next={next && { to: itemPath('transition', next.id), label: next.name }}
      />
    </article>
  );
}
