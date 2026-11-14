import { useState } from 'react';
import { useLibrary, useVideos } from '../../data';
import { itemName } from '../../domain/library';
import { Loading } from '../components/common';
import { VideoForm } from '../components/VideoForm';
import { VideoRow } from '../components/VideoList';

/** Only show the search box once there are enough bookmarks to need it. */
const SEARCH_THRESHOLD = 4;

export default function Videos() {
  const lib = useLibrary();
  const all = useVideos();
  const [query, setQuery] = useState('');
  if (!lib || !all) return <Loading />;

  const withNames = all.map((video) => ({
    video,
    linkedName: video.linkedKind ? itemName(lib, video.linkedKind, video.linkedId) : null,
  }));
  const needle = query.trim().toLowerCase();
  const shown = withNames.filter(
    ({ video, linkedName }) =>
      !needle || [video.title, video.note, linkedName ?? ''].some((text) => text.toLowerCase().includes(needle)),
  );

  return (
    <div className="stack">
      <div>
        <h1>Video bookmarks</h1>
        <p className="muted">
          Save YouTube links at the exact moment a detail is explained. Paste a link with <code>?t=</code> and the start
          time fills in. Links open on YouTube in a new tab.
        </p>
      </div>
      <div className="card">
        <h2>Add a bookmark</h2>
        <VideoForm />
      </div>
      <div className="card">
        <div className="section-head">
          <h2>Saved ({all.length})</h2>
          {all.length >= SEARCH_THRESHOLD && (
            <input
              type="search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search bookmarks"
            />
          )}
        </div>
        {shown.length === 0 ? (
          <p className="muted">{all.length === 0 ? 'No bookmarks yet.' : 'No matches.'}</p>
        ) : (
          <ul className="video-list">
            {shown.map(({ video, linkedName }) => (
              <VideoRow key={video.id} video={video} linkedName={linkedName} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
