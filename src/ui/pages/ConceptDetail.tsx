import { Link, useParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { reviewOf } from '../../core/library';
import { Bullets, Loading, Missing, NotesBlock, Pager, Section, StudyStatusPill } from '../components/common';
import { ItemPicture } from '../components/ItemPicture';
import { LinkedVideos } from '../components/VideoList';
import { ConceptArtwork } from '../graphics/ConceptSvg';
import { editPath, itemPath, ROUTES } from '../routes';

export default function ConceptDetail() {
  const { id = '' } = useParams();
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const concept = lib.conceptById.get(id);
  if (!concept) return <Missing what="Concept" back={{ to: ROUTES.concepts, label: 'All concepts' }} />;

  const usedIn = lib.positions.filter((p) => p.conceptIds.includes(concept.id));
  const index = lib.concepts.findIndex((c) => c.id === concept.id);
  const previous = lib.concepts[index - 1];
  const next = lib.concepts[index + 1];

  return (
    <article className="stack">
      <Link to={ROUTES.concepts} className="small">
        ← All concepts
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            Concept <StudyStatusPill state={reviewOf(lib, 'concept', concept.id)} />
          </p>
          <h1>{concept.name}</h1>
          <p className="lead">{concept.summary}</p>
        </div>
        <Link className="button small" to={editPath('concept', concept.id)}>
          Edit
        </Link>
      </div>
      <div className="card">
        <ItemPicture kind="concept" id={concept.id}>
          <ConceptArtwork id={concept.id} name={concept.name} />
        </ItemPicture>
        <Section title="Key points">
          <Bullets items={concept.keyPoints} />
        </Section>
        {concept.drill && (
          <Section title="Try this drill">
            <p>{concept.drill}</p>
          </Section>
        )}
        {usedIn.length > 0 && (
          <Section title="Where it matters">
            <ul className="chip-list">
              {usedIn.map((p) => (
                <li key={p.id}>
                  <Link className="chip" to={itemPath('position', p.id)}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <NotesBlock notes={concept.notes} />
        <LinkedVideos kind="concept" id={concept.id} />
      </div>
      <Pager
        previous={previous && { to: itemPath('concept', previous.id), label: previous.name }}
        next={
          next
            ? { to: itemPath('concept', next.id), label: next.name }
            : { to: ROUTES.positions, label: 'On to the position map' }
        }
      />
    </article>
  );
}
