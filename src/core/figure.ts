import { roundSvg } from './svgNumber';

/**
 * Geometry for the jointed figures in the diagrams. A pose is a handful of joint positions;
 * this turns it into the paths and circles a component can draw without doing any maths itself.
 * Coordinates are SVG user units with y pointing down.
 */

export type Point = readonly [x: number, y: number];

/** A two-segment limb, given by its middle joint and its end: elbow then hand, or knee then foot. */
export type Limb = readonly [joint: Point, end: Point];

export interface FigurePose {
  /** Centre of the head. */
  head: Point;
  /** Top of the spine, between the shoulders. */
  neck: Point;
  /** Bottom of the spine, between the hips. */
  hip: Point;
  /**
   * Which side the face is on: turn the neck-to-head direction a quarter turn clockwise (1) or
   * anticlockwise (-1) on screen. A standing figure with 1 looks right; lying with its head to the left, up.
   */
  face: 1 | -1;
  /** Pulls the spine into a curve (a rounded back, a bridge). Left out, the spine is straight. */
  spine?: Point;
  /** The far limb is drawn behind the body, the near limb in front of it. */
  arms: { far: Limb; near: Limb };
  legs: { far: Limb; near: Limb };
}

export const LIMB_NAMES = ['farLeg', 'farArm', 'nearLeg', 'nearArm'] as const;
export type LimbName = (typeof LIMB_NAMES)[number];

/** Body measurements, in the same units as the pose. */
export const FIGURE_SIZE = {
  headRadius: 11,
  torsoWidth: 22,
  armWidth: 10,
  legWidth: 13,
  handRadius: 4.5,
  footRadius: 5.5,
} as const;

/** How far down the spine the shoulders sit, as a fraction of its length. */
const SHOULDER_AT = 0.06;
/** The belt covers this stretch of the spine, as fractions of its length. */
const BELT_FROM = 0.74;
const BELT_TO = 0.86;
/** Hair covers the part of the head within this angle of its middle: a little under half the head. */
const HAIR_HALF_ANGLE = (78 * Math.PI) / 180;
/** Hair sits a little towards the back of the head rather than dead on top. */
const HAIR_TILT = (25 * Math.PI) / 180;

export interface LimbParts {
  /** Open path from the body through the joint to the end. */
  path: string;
  /** Where the hand or foot goes. */
  end: Point;
}

export interface FigureParts {
  torso: string;
  belt: string;
  head: Point;
  hair: string;
  limbs: Record<LimbName, LimbParts>;
}

function fmt([x, y]: Point): string {
  return `${roundSvg(x)} ${roundSvg(y)}`;
}

/** The control point that makes a straight spine: halfway between neck and hip. */
function spineControl(pose: FigurePose): Point {
  return pose.spine ?? [(pose.neck[0] + pose.hip[0]) / 2, (pose.neck[1] + pose.hip[1]) / 2];
}

/** A point on the spine, t = 0 at the neck and 1 at the hip. The spine is a quadratic curve. */
export function pointOnSpine(pose: FigurePose, t: number): Point {
  const c = spineControl(pose);
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const d = t * t;
  return [a * pose.neck[0] + b * c[0] + d * pose.hip[0], a * pose.neck[1] + b * c[1] + d * pose.hip[1]];
}

function limbParts(root: Point, [joint, end]: Limb): LimbParts {
  return { path: `M${fmt(root)} L${fmt(joint)} L${fmt(end)}`, end };
}

/**
 * A cap of hair on the side of the head away from the neck, tilted towards the back of the head.
 * Angles are measured clockwise on screen because y points down.
 */
function hairPath(pose: FigurePose): string {
  const r = FIGURE_SIZE.headRadius;
  const [hx, hy] = pose.head;
  const away = Math.atan2(hy - pose.neck[1], hx - pose.neck[0]);
  const mid = away - pose.face * HAIR_TILT;
  const from: Point = [hx + r * Math.cos(mid - HAIR_HALF_ANGLE), hy + r * Math.sin(mid - HAIR_HALF_ANGLE)];
  const to: Point = [hx + r * Math.cos(mid + HAIR_HALF_ANGLE), hy + r * Math.sin(mid + HAIR_HALF_ANGLE)];
  return `M${fmt(from)} A${r} ${r} 0 0 1 ${fmt(to)} Z`;
}

/** Everything needed to draw one figure. */
export function figureParts(pose: FigurePose): FigureParts {
  const shoulder = pointOnSpine(pose, SHOULDER_AT);
  return {
    torso: `M${fmt(pose.neck)} Q${fmt(spineControl(pose))} ${fmt(pose.hip)}`,
    belt: `M${fmt(pointOnSpine(pose, BELT_FROM))} L${fmt(pointOnSpine(pose, BELT_TO))}`,
    head: pose.head,
    hair: hairPath(pose),
    limbs: {
      farLeg: limbParts(pose.hip, pose.legs.far),
      farArm: limbParts(shoulder, pose.arms.far),
      nearLeg: limbParts(pose.hip, pose.legs.near),
      nearArm: limbParts(shoulder, pose.arms.near),
    },
  };
}

/** Length of each side of an arrowhead. */
const ARROW_HEAD = 9;
/** Angle between the shaft and each side of the head. */
const ARROW_HEAD_ANGLE = (32 * Math.PI) / 180;

/**
 * An arrow from one point to another as a single open path: the shaft, then a two-stroke head.
 * `bend` bows the shaft sideways by that many units (positive bows to the left of travel on screen).
 */
export function arrowPath(from: Point, to: Point, bend = 0): string {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  // Doubling the offset puts the curve's midpoint `bend` away from the straight line.
  const control: Point = [
    (from[0] + to[0]) / 2 + (dy / length) * bend * 2,
    (from[1] + to[1]) / 2 - (dx / length) * bend * 2,
  ];
  // The head lines up with the last stretch of the curve, which leaves the control point.
  const back = Math.atan2(control[1] - to[1], control[0] - to[0]);
  const side = (turn: number): Point => [
    to[0] + ARROW_HEAD * Math.cos(back + turn),
    to[1] + ARROW_HEAD * Math.sin(back + turn),
  ];
  return `M${fmt(from)} Q${fmt(control)} ${fmt(to)} M${fmt(side(ARROW_HEAD_ANGLE))} L${fmt(to)} L${fmt(side(-ARROW_HEAD_ANGLE))}`;
}
