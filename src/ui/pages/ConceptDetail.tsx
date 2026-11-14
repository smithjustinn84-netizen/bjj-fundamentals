import { Link, useParams } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { cardId } from '../../core/srs';
import { Bullets, Loading, Missing, NotesBlock, ProgressDot, Section } from '../components/common';
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
            Concept <ProgressDot state={lib.reviews.get(cardId('concept', concept.id))} />
          </p>
          <h1>{concept.name}</h1>
          <p className="lead">{concept.summary}</p>
        </div>
        <Link className="button" to={editPath('concept', concept.id)}>
          Edit
        </Link>
      </div>
      <div className="card">
        <ConceptArtwork id={concept.id} name={concept.name} />
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
      <nav className="pager">
        {previous ? <Link to={itemPath('concept', previous.id)}>← {previous.name}</Link> : <span />}
        {next ? (
          <Link to={itemPath('concept', next.id)}>{next.name} →</Link>
        ) : (
          <Link to={ROUTES.positions}>On to positions →</Link>
        )}
      </nav>
    </article>
  );
}
