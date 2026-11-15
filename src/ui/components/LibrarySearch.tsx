import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KIND_LABELS } from '../../core/labels';
import type { Library } from '../../core/library';
import { SEARCH_RESULT_LIMIT, searchLibrary } from '../../core/search';
import { Icon } from '../graphics/icons';
import { itemPath } from '../routes';

/** One box that finds any concept, position or technique by its name or its text. */
export function LibrarySearch({ lib }: { lib: Library }) {
  const [query, setQuery] = useState('');
  const hits = searchLibrary(lib, query, SEARCH_RESULT_LIMIT);
  const searching = query.trim() !== '';

  return (
    <search className="library-search">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a concept, position or technique…"
        aria-label="Search your library"
      />
      {/* Announced politely, so a screen reader hears the count change as the query is typed. */}
      <p className="visually-hidden" role="status">
        {searching ? `${hits.length} found` : ''}
      </p>
      {searching && hits.length === 0 && <p className="muted">Nothing matches “{query.trim()}”.</p>}
      {hits.length > 0 && (
        <ul className="transition-list">
          {hits.map((hit) => (
            <li key={`${hit.kind}:${hit.id}`}>
              <Link className="row-link" to={itemPath(hit.kind, hit.id)}>
                <span className="row-text">
                  <span className="row-name">{hit.name}</span>
                  <span className="row-meta">
                    <span className="tag">{KIND_LABELS[hit.kind]}</span>
                    {hit.detail}
                  </span>
                </span>
                <Icon name="chevron" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </search>
  );
}
