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

/** The joints that fix the spine's curve. */
type SpinePose = Pick<FigurePose, 'neck' | 'hip' | 'spine'>;

/** The control point that makes a straight spine: halfway between neck and hip. */
function spineControl(pose: SpinePose): Point {
  return pose.spine ?? [(pose.neck[0] + pose.hip[0]) / 2, (pose.neck[1] + pose.hip[1]) / 2];
}

/** A point on the spine, t = 0 at the neck and 1 at the hip. The spine is a quadratic curve. */
export function pointOnSpine(pose: SpinePose, t: number): Point {
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

/** Below this much of the way through a tween the figure faces as it started; from here on, as it ends. */
const FACE_TURNS_AT = 0.5;

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Where a body segment ends part-way through a move. The segment is given at both ends of the move
 * as root and tip; it turns through the shorter arc and changes length evenly, then hangs off `root`.
 * Turning rather than sliding the tip keeps a limb its own length while it swings.
 */
function swing(from: readonly [Point, Point], to: readonly [Point, Point], root: Point, t: number): Point {
  const fromAngle = Math.atan2(from[1][1] - from[0][1], from[1][0] - from[0][0]);
  const toAngle = Math.atan2(to[1][1] - to[0][1], to[1][0] - to[0][0]);
  const fromLength = Math.hypot(from[1][0] - from[0][0], from[1][1] - from[0][1]);
  const toLength = Math.hypot(to[1][0] - to[0][0], to[1][1] - to[0][1]);
  // Wrapped into half a turn either way, so the segment never goes the long way round.
  const turn = Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
  const angle = fromAngle + turn * t;
  const length = mix(fromLength, toLength, t);
  return [root[0] + length * Math.cos(angle), root[1] + length * Math.sin(angle)];
}

/** The spine's bend as [how far along the neck-to-hip line, how far off to its side], so it can turn with the body. */
function spineBend(pose: SpinePose): Point {
  const [cx, cy] = spineControl(pose);
  const dx = pose.hip[0] - pose.neck[0];
  const dy = pose.hip[1] - pose.neck[1];
  const length = Math.hypot(dx, dy) || 1;
  const along = ((cx - pose.neck[0]) * dx + (cy - pose.neck[1]) * dy) / (length * length);
  const aside = ((cx - pose.neck[0]) * -dy + (cy - pose.neck[1]) * dx) / length;
  return [along, aside];
}

function spineFromBend(neck: Point, hip: Point, [along, aside]: Point): Point {
  const dx = hip[0] - neck[0];
  const dy = hip[1] - neck[1];
  const length = Math.hypot(dx, dy) || 1;
  return [neck[0] + along * dx + (aside * -dy) / length, neck[1] + along * dy + (aside * dx) / length];
}

function shoulder(pose: SpinePose): Point {
  return pointOnSpine(pose, SHOULDER_AT);
}

/**
 * The pose part-way through a move from one pose to another: t = 0 is `from`, 1 is `to`.
 * The hips travel in a straight line and every segment above and below them turns about its joint.
 */
export function tweenPose(from: FigurePose, to: FigurePose, t: number): FigurePose {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const hip: Point = [mix(from.hip[0], to.hip[0], t), mix(from.hip[1], to.hip[1], t)];
  const neck = swing([from.hip, from.neck], [to.hip, to.neck], hip, t);
  const head = swing([from.neck, from.head], [to.neck, to.head], neck, t);
  const fromBend = spineBend(from);
  const toBend = spineBend(to);
  const curved = from.spine !== undefined || to.spine !== undefined;
  const body: SpinePose = {
    neck,
    hip,
    ...(curved
      ? { spine: spineFromBend(neck, hip, [mix(fromBend[0], toBend[0], t), mix(fromBend[1], toBend[1], t)]) }
      : {}),
  };
  const limb = (fromRoot: Point, a: Limb, toRoot: Point, b: Limb, root: Point): Limb => {
    const joint = swing([fromRoot, a[0]], [toRoot, b[0]], root, t);
    return [joint, swing([a[0], a[1]], [b[0], b[1]], joint, t)];
  };
  const fromShoulder = shoulder(from);
  const toShoulder = shoulder(to);
  const atShoulder = shoulder(body);
  return {
    ...body,
    head,
    face: t < FACE_TURNS_AT ? from.face : to.face,
    arms: {
      far: limb(fromShoulder, from.arms.far, toShoulder, to.arms.far, atShoulder),
      near: limb(fromShoulder, from.arms.near, toShoulder, to.arms.near, atShoulder),
    },
    legs: {
      far: limb(from.hip, from.legs.far, to.hip, to.legs.far, hip),
      near: limb(from.hip, from.legs.near, to.hip, to.legs.near, hip),
    },
  };
}

/**
 * The pose moved straight up just far enough that no joint is below `floorY` (y points down, so
 * "below" is a larger y). A body turning over part-way through a move would otherwise dip through the mat.
 */
export function liftPose(pose: FigurePose, floorY: number): FigurePose {
  const limbs = [pose.arms.far, pose.arms.near, pose.legs.far, pose.legs.near];
  const lowest = Math.max(pose.head[1], pose.neck[1], pose.hip[1], ...limbs.flat().map((point) => point[1]));
  const rise = lowest - floorY;
  if (rise <= 0) return pose;
  const up = ([x, y]: Point): Point => [x, y - rise];
  const upLimb = ([joint, end]: Limb): Limb => [up(joint), up(end)];
  return {
    ...pose,
    head: up(pose.head),
    neck: up(pose.neck),
    hip: up(pose.hip),
    ...(pose.spine ? { spine: up(pose.spine) } : {}),
    arms: { far: upLimb(pose.arms.far), near: upLimb(pose.arms.near) },
    legs: { far: upLimb(pose.legs.far), near: upLimb(pose.legs.near) },
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
