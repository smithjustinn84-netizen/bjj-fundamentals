import type { ReactNode } from 'react';
import { useLinkedVideos } from '../../bindings';
import type { ItemKind } from '../../core/models';
import { useOnline } from '../useOnline';
import { VideoPlayer } from './VideoPlayer';

/**
 * The picture at the top of a concept or technique: its bookmarked video when it has one and there
 * is a connection to play it, otherwise the drawing passed as children.
 */
export function ItemPicture({
  kind,
  id,
  className = '',
  children,
}: {
  kind: ItemKind;
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const linked = useLinkedVideos(kind, id);
  const online = useOnline();
  // Nothing while the bookmarks load, so the drawing does not flash up before the video.
  if (!linked) return null;
  if (online && linked.length > 0) return <VideoPlayer videos={linked} className={className} />;
  return children;
}
