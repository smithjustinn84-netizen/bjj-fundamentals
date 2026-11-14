import { useState } from 'react';
import type { Position, Transition } from '../../core/models';
import { TapArtwork } from './ConceptSvg';
import { hasPositionArtwork, PositionArtwork } from './PositionSvg';

export const HERO_DOJO_ARTWORK = './artwork/hero-dojo.webp';

export function ArtworkFrame({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className={`artwork-frame ${className}`.trim()}>
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
    </figure>
  );
}

/**
 * A technique drawn as its two ends: the position it starts from and the one it reaches, or a tap
 * for a submission. Draws nothing when either end has no picture, such as a position the user added.
 */
export function TransitionArtwork({
  transition,
  positionById,
  className = '',
}: {
  transition: Transition;
  positionById: Map<string, Position>;
  className?: string;
}) {
  const from = positionById.get(transition.fromId);
  const to = positionById.get(transition.toId);
  const isSubmission = transition.type === 'submission';
  if (!from || !hasPositionArtwork(from.id)) return null;
  if (!isSubmission && (!to || !hasPositionArtwork(to.id))) return null;
  return (
    <div className={`transition-artwork ${className}`.trim()}>
      <div>
        <PositionArtwork id={from.id} name={from.name} />
        <p className="small muted">{from.name}</p>
      </div>
      <svg className={`transition-arrow type-${transition.type}`} viewBox="0 0 40 24" aria-hidden="true">
        <path d="M3 12h32M26 4l9 8-9 8" />
      </svg>
      <div>
        {isSubmission || !to ? <TapArtwork /> : <PositionArtwork id={to.id} name={to.name} />}
        <p className="small muted">{isSubmission || !to ? 'Tap' : to.name}</p>
      </div>
    </div>
  );
}
