import { useState } from 'react';
import { FIGURE_SIZE, type FigurePose, liftPose, tweenPose } from '../../core/figure';
import { endsTheRoll, type Position, type Transition } from '../../core/models';
import { reversesRoles } from '../../core/techniqueArt';
import { useMediaQuery } from '../useMediaQuery';
import { TapArtwork, TapScene } from './ConceptSvg';
import { Diagram, MAT_Y } from './Diagram';
import { Icon } from './icons';
import { PositionArtwork, type PositionScene, positionScene, SceneFigures, StillScene } from './PositionSvg';
import { useTween } from './useTween';

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

/** How long the start position is shown before anyone moves. */
const HOLD_MS = 600;
/** How long the move from the start position to the end position takes. */
const TRAVEL_MS = 1400;
/** From this far through the move, limbs overlap the way they do in the end position. */
const LAYERS_CHANGE_AT = 0.5;
/** A scene's rings and arrows fade over this much of the move: out at its start, in at its end. */
const MARKS_FADE = 0.25;

/** The lowest a joint can be with the foot on it still resting on the mat, in a scene seen from the side. */
const FLOOR_Y = MAT_Y - FIGURE_SIZE.footRadius;

/** Ease in and out (cubic): bodies gather speed, then settle. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * One picture that plays a technique once: the two people move from the start scene into the end
 * scene. The start scene fades into the end instead when the two are seen from different sides, and
 * into a tap when there is no end scene. Remount it to play again.
 */
function MovingStage({
  label,
  start,
  end,
  reversed,
}: {
  label: string;
  start: PositionScene;
  end: PositionScene | undefined;
  reversed: boolean;
}) {
  const t = easeInOut(useTween(TRAVEL_MS, HOLD_MS));
  const startView = start.view ?? 'side';
  const endView = end?.view ?? 'side';
  // A body cannot turn from a side view into an overhead one, so between views one picture fades into the other.
  if (!end || startView !== endView) {
    return (
      <Diagram label={label} shape="tall" view={startView} turning={{ to: endView, amount: t }}>
        <g opacity={1 - t}>
          <StillScene scene={start} />
        </g>
        <g opacity={t}>{end ? <StillScene scene={end} /> : <TapScene />}</g>
      </Diagram>
    );
  }
  // Seen from above there is no floor to stay on.
  const between = (from: FigurePose, to: FigurePose) =>
    startView === 'side' ? liftPose(tweenPose(from, to, t), FLOOR_Y) : tweenPose(from, to, t);
  // Each person keeps their gi. After a reversal the one who began underneath takes the top place.
  const light = { pose: between(start.light, reversed ? end.dark : end.light), gi: 'light' } as const;
  const dark = { pose: between(start.dark, reversed ? end.light : end.dark), gi: 'dark' } as const;
  const arrived = t >= LAYERS_CHANGE_AT;
  return (
    <Diagram label={label} shape="tall" view={startView}>
      <SceneFigures
        layers={arrived ? end.layers : start.layers}
        // A scene's layers name its two places, so after a reversal the end scene's places hold the other person.
        people={arrived && reversed ? { light: dark, dark: light } : { light, dark }}
      />
      {start.extras && <g opacity={Math.max(0, 1 - t / MARKS_FADE)}>{start.extras()}</g>}
      {end.extras && <g opacity={Math.max(0, 1 - (1 - t) / MARKS_FADE)}>{end.extras()}</g>}
    </Diagram>
  );
}

/**
 * A technique's picture. The two people move from the position it starts in to the one it reaches,
 * or the start fades into the end (a tap, for a submission); it plays once and can be replayed. When the user
 * prefers reduced motion, or the technique ends where it began, it is the two ends side by side.
 * Draws nothing when either end has no picture, such as a position the user added.
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
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [plays, setPlays] = useState(0);
  const from = positionById.get(transition.fromId);
  // Undefined when the technique ends the roll: its picture ends in a tap instead.
  const to = endsTheRoll(transition.type) ? undefined : positionById.get(transition.toId);
  const start = from && positionScene(from.id);
  const end = to && positionScene(to.id);
  if (!from || !start) return null;
  if (!endsTheRoll(transition.type) && (!to || !end)) return null;
  const endName = to ? to.name : 'Tap';

  if (reducedMotion || to?.id === from.id) {
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
          <p className="small muted">{endName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-motion ${className}`.trim()}>
      <MovingStage
        key={`${transition.id}:${plays}`}
        label={`Diagram of ${transition.name}: from ${from.name} to ${to ? to.name : 'a tap'}`}
        start={start}
        end={end}
        reversed={reversesRoles(transition)}
      />
      <div className="transition-motion-caption">
        <p className="small muted">
          {from.name}
          <Icon name="arrow" />
          <span className="visually-hidden">to</span>
          {endName}
        </p>
        <button type="button" className="link small" onClick={() => setPlays((n) => n + 1)}>
          <Icon name="replay" />
          Replay
        </button>
      </div>
    </div>
  );
}
