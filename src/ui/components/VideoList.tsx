import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLinkedVideos, videos } from '../../bindings';
import { KIND_LABELS } from '../../core/labels';
import type { ItemKind, VideoBookmark } from '../../core/models';
import { formatTime, watchUrl } from '../../core/youtube';
import { itemPath } from '../routes';
import { VideoForm } from './VideoForm';

interface RowProps {
  video: VideoBookmark;
  /** Name of the linked item. When given, a link to that item is shown under the title. */
  linkedName?: string | null;
}

export function VideoRow({ video, linkedName }: RowProps) {
  function remove() {
    if (confirm(`Delete the bookmark "${video.title}"?`)) void videos.remove(video.id);
  }

  return (
    <li className="video-row">
      <a
        href={watchUrl(video.youtubeId, video.startSeconds)}
        target="_blank"
        rel="noopener noreferrer"
        className="video-link"
      >
        <span className="play" aria-hidden="true">
          ▶
        </span>
        <span>
          <strong>{video.title}</strong>
          <span className="muted"> · {formatTime(video.startSeconds)}</span>
        </span>
      </a>
      {video.note && <p className="muted small">{video.note}</p>}
      {linkedName && video.linkedKind && (
        <p className="small">
          {KIND_LABELS[video.linkedKind]}: <Link to={itemPath(video.linkedKind, video.linkedId)}>{linkedName}</Link>
        </p>
      )}
      <button type="button" className="link danger small" onClick={remove}>
        Delete
      </button>
    </li>
  );
}

/** The bookmarks attached to one item, with an inline "add" form. */
export function LinkedVideos({ kind, id }: { kind: ItemKind; id: string }) {
  const linked = useLinkedVideos(kind, id);
  const [adding, setAdding] = useState(false);
  return (
    <section className="section">
      <div className="section-head">
        <h2>Video bookmarks</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}>
            + Add
          </button>
        )}
      </div>
      {adding && <VideoForm linkedTo={{ kind, id }} onDone={() => setAdding(false)} />}
      {linked?.length === 0 && !adding && (
        <p className="muted">Save a YouTube link at the exact moment that explains this well.</p>
      )}
      {linked && linked.length > 0 && (
        <ul className="video-list">
          {linked.map((v) => (
            <VideoRow key={v.id} video={v} />
          ))}
        </ul>
      )}
    </section>
  );
}
