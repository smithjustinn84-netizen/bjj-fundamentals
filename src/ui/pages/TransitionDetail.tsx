import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { isOnBlueBeltTest } from '../../core/beltTest';
import { TRANSITION_LABELS } from '../../core/labels';
import { reviewOf } from '../../core/library';
import { endsTheRoll } from '../../core/models';
import { Bullets, Loading, Missing, NotesBlock, ProgressDot, Section } from '../components/common';
import { confirmDelete } from '../components/confirmDelete';
import { LinkedVideos } from '../components/VideoList';
import { TransitionArtwork } from '../graphics/Artwork';
import { editPath, itemPath, ROUTES } from '../routes';

export default function TransitionDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const transition = lib.transitionById.get(id);
  if (!transition) return <Missing what="Technique" back={{ to: ROUTES.positions, label: 'Position map' }} />;

  const from = lib.positionById.get(transition.fromId);
  const to = lib.positionById.get(transition.toId);
  const backPath = from ? itemPath('position', from.id) : ROUTES.positions;

  const remove = async () => {
    if (await confirmDelete(lib, 'transition', transition.id)) navigate(backPath);
  };

  return (
    <article className="stack">
      <Link to={backPath} className="small">
        ← {from ? from.name : 'Position map'}
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
            <ProgressDot state={reviewOf(lib, 'transition', transition.id)} />
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
        </div>
        <div className="row">
          <Link className="button" to={editPath('transition', transition.id)}>
            Edit
          </Link>
          <button type="button" className="danger" onClick={remove}>
            Delete
          </button>
        </div>
      </div>
      <div className="card">
        <TransitionArtwork transition={transition} positionById={lib.positionById} />
        <Section title="Steps">
          <Bullets items={transition.steps} ordered />
        </Section>
        {transition.commonMistakes.length > 0 && (
          <Section title="Common mistakes">
            <Bullets items={transition.commonMistakes} />
          </Section>
        )}
        {endsTheRoll(transition.type) && (
          <p className="drill">Apply submissions slowly in training and let go as soon as your partner taps.</p>
        )}
        <NotesBlock notes={transition.notes} />
        <LinkedVideos kind="transition" id={transition.id} />
      </div>
    </article>
  );
}
