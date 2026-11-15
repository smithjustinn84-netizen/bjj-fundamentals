import { useLinkedVideos } from '../../bindings';
import type { Position, Transition } from '../../core/models';
import { TransitionArtwork } from '../graphics/Artwork';
import { useOnline } from '../useOnline';
import { VideoPlayer } from './VideoPlayer';

/**
 * What a technique looks like: its bookmarked video when it has one and there is a connection to
 * play it, otherwise the drawing of where it starts and ends.
 */
export function TechniquePicture({
  transition,
  positionById,
  className = '',
}: {
  transition: Transition;
  positionById: Map<string, Position>;
  className?: string;
}) {
  const linked = useLinkedVideos('transition', transition.id);
  const online = useOnline();
  // Nothing while the bookmarks load, so the drawing does not flash up before the video.
  if (!linked) return null;
  if (online && linked.length > 0) return <VideoPlayer videos={linked} className={className} />;
  return <TransitionArtwork transition={transition} positionById={positionById} className={className} />;
}
