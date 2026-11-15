import { Link } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { reviewOf } from '../../core/library';
import { Loading, ProgressDot } from '../components/common';
import { ConceptArtwork } from '../graphics/ConceptSvg';
import { itemPath, newItemPath } from '../routes';

export default function Concepts() {
  const lib = useLibrary();
  if (!lib) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Concepts</h1>
          <p className="muted">The big ideas that make every technique work. Learn these first.</p>
        </div>
        <Link className="button" to={newItemPath('concept')}>
          + New concept
        </Link>
      </div>
      <ol className="tile-list">
        {lib.concepts.map((c, i) => (
          <li key={c.id}>
            <Link to={itemPath('concept', c.id)} className="tile">
              <span className="tile-num">{i + 1}</span>
              <ConceptArtwork id={c.id} name={c.name} className="thumb-artwork" />
              <span className="grow">
                <strong>{c.name}</strong>
                <span className="muted small block">{c.summary}</span>
              </span>
              <ProgressDot state={reviewOf(lib, 'concept', c.id)} />
            </Link>
          </li>
        ))}
      </ol>
      {lib.concepts.length === 0 && <p className="muted">No concepts yet.</p>}
    </div>
  );
}
