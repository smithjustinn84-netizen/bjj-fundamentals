import { endsTheRoll, type Position, type Transition } from '../../core/models';
import { TapArtwork } from './ConceptSvg';
import { hasPositionArtwork, PositionArtwork } from './PositionSvg';

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
  if (!from || !hasPositionArtwork(from.id)) return null;
  // Undefined when the technique ends the roll: its picture is a tap instead.
  const to = endsTheRoll(transition.type) ? undefined : positionById.get(transition.toId);
  if (!endsTheRoll(transition.type) && (!to || !hasPositionArtwork(to.id))) return null;
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
        {to ? <PositionArtwork id={to.id} name={to.name} /> : <TapArtwork />}
        <p className="small muted">{to ? to.name : 'Tap'}</p>
      </div>
    </div>
  );
}
