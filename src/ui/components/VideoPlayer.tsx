import { useState } from 'react';
import type { VideoBookmark } from '../../core/models';
import { embedUrl, formatTime } from '../../core/youtube';

/**
 * YouTube's player for an item's bookmarks, starting at the bookmarked moment. This iframe is the one
 * thing in the app that contacts another site (see "Hard constraints" in AGENTS.md), so render it only
 * where a video is the point of the page. With several bookmarks the first plays and the rest are a tap away.
 */
export function VideoPlayer({ videos, className = '' }: { videos: readonly VideoBookmark[]; className?: string }) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  // Falls back to the first when nothing is chosen yet or the chosen bookmark has been deleted.
  const playing = videos.find((video) => video.id === chosenId) ?? videos[0];
  if (!playing) return null;
  return (
    <div className={`video-player ${className}`.trim()}>
      <iframe
        // A new frame per video, so switching never leaves the old one playing underneath.
        key={playing.id}
        src={embedUrl(playing.youtubeId, playing.startSeconds)}
        title={`Video: ${playing.title}`}
        loading="lazy"
        // YouTube refuses to play in a frame that hides which site it is on.
        referrerPolicy="strict-origin-when-cross-origin"
        allow="fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
      />
      {videos.length > 1 && (
        <div className="video-player-choices">
          {videos.map((video) => (
            <button
              key={video.id}
              type="button"
              className="chip"
              aria-pressed={video.id === playing.id}
              onClick={() => setChosenId(video.id)}
            >
              {video.title} · {formatTime(video.startSeconds)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
