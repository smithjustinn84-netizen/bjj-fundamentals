import { Link, useParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { reviewOf } from '../../core/library';
import {
  Bullets,
  DetailHeader,
  Loading,
  Missing,
  NotesBlock,
  Pager,
  Section,
  StudyStatusPill,
} from '../components/common';
import { ItemPicture } from '../components/ItemPicture';
import { LinkedVideos } from '../components/VideoList';
import { ConceptArtwork } from '../graphics/ConceptSvg';
import { editPath, itemPath, ROUTES } from '../routes';

export default function ConceptDetail() {
  const { id = '' } = useParams();
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const concept = lib.conceptById.get(id);
  if (!concept) return <Missing what="Concept" back={{ to: ROUTES.concepts, label: 'Concepts' }} />;

  const usedIn = lib.positions.filter((p) => p.conceptIds.includes(concept.id));
  const index = lib.concepts.findIndex((c) => c.id === concept.id);
  const previous = lib.concepts[index - 1];
  const next = lib.concepts[index + 1];

  return (
    <article className="stack">
      <DetailHeader
        back={{ to: ROUTES.concepts, label: 'Concepts' }}
        editTo={editPath('concept', concept.id)}
        eyebrow={
          <>
            Concept <StudyStatusPill state={reviewOf(lib, 'concept', concept.id)} />
          </>
        }
        title={concept.name}
        lead={concept.summary}
      />
      <div className="card detail-layout">
        <div className="detail-picture">
          <ItemPicture kind="concept" id={concept.id}>
            <ConceptArtwork id={concept.id} name={concept.name} />
          </ItemPicture>
        </div>
        <div className="detail-body">
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
      </div>
      <Pager
        previous={previous && { to: itemPath('concept', previous.id), label: previous.name }}
        next={
          next
            ? { to: itemPath('concept', next.id), label: next.name }
            : { to: ROUTES.positions, label: 'On to positions' }
        }
      />
    </article>
  );
}
