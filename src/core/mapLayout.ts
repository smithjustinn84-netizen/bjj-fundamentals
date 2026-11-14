import type { MapOrientation, Position, PositionCategory, Transition, TransitionType } from './models';

/**
 * Geometry for the position map: where each position sits and how each technique's arrow curves.
 * Pure numbers and SVG path strings, so the layout can be tested without drawing anything.
 *
 * Positions are grouped into lanes by category. Lanes run in "dominance" order, from standing
 * through guard and scrambles to top control and the back, so most techniques point forwards.
 */

/** Lane order along the map's main axis, lowest first. */
const LANE_RANK: Record<PositionCategory, number> = {
  standing: 0,
  guard: 1,
  scramble: 2,
  top: 3,
  back: 4,
};

interface MapGeometry {
  nodeWidth: number;
  nodeHeight: number;
  /** Space between neighbouring lanes, where most arrows travel. */
  laneGap: number;
  /** Space between positions in the same lane. */
  nodeGap: number;
  /** Margin around the whole map, leaving room for arrows that bow outwards. */
  padding: number;
  /** Room kept before each lane's positions for the lane's heading. */
  headingBand: number;
  /** Lanes are laid out at least this many positions wide, so arrows have room to pass around a lone position. */
  minLaneSlots: number;
}

/** Sizes in SVG user units. The vertical map is narrower so it fits a phone without shrinking the text. */
const GEOMETRY: Record<MapOrientation, MapGeometry> = {
  horizontal: {
    nodeWidth: 132,
    nodeHeight: 58,
    laneGap: 68,
    nodeGap: 34,
    padding: 32,
    headingBand: 26,
    minLaneSlots: 3,
  },
  vertical: { nodeWidth: 108, nodeHeight: 60, laneGap: 52, nodeGap: 10, padding: 14, headingBand: 22, minLaneSlots: 3 },
};

/** The smallest distance an arrow's midpoint bows away from the straight line between two positions. */
const EDGE_BOW = 16;
/** The largest bow tried, as a multiple of EDGE_BOW. */
const MAX_BOW_STEPS = 8;
/**
 * Bows to try for each arrow, gentlest first and alternating sides, in half steps of EDGE_BOW.
 * The one that crosses the least of other positions, and is not already taken by a parallel arrow, wins.
 */
const BOW_CANDIDATES = Array.from({ length: MAX_BOW_STEPS * 2 - 1 }, (_, index) => (1 + index / 2) * EDGE_BOW).flatMap(
  (bow) => [bow, -bow],
);
/** How close an arrow may pass to a position it does not belong to. */
const EDGE_CLEARANCE = 6;
/** Points checked along each candidate curve when looking for collisions. */
const CURVE_SAMPLES = 24;
/** Gap between a position's box and the ends of its arrows. */
const EDGE_GAP = 5;

export interface MapNode {
  id: string;
  category: PositionCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Submissions available from here. They end the match, so they are counted rather than drawn as arrows. */
  submissions: number;
}

export interface MapEdge {
  /** The transition's id. */
  id: string;
  fromId: string;
  toId: string;
  type: TransitionType;
  /** How far the arrow's midpoint bows to the right of its direction of travel; negative bows left. */
  bow: number;
  /** SVG path data, from the edge of one position's box to the edge of the other's. */
  path: string;
}

export interface MapLane {
  category: PositionCategory;
  /**
   * Top of the lane's heading. In a horizontal map x is the centre of the lane's column;
   * in a vertical map it is the left edge of the lane's row.
   */
  labelX: number;
  labelY: number;
}

export interface MapLayout {
  width: number;
  height: number;
  lanes: MapLane[];
  nodes: MapNode[];
  edges: MapEdge[];
}

interface Point {
  x: number;
  y: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

function centreOf(node: MapNode): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

/** The point where a line from the node's centre towards `target` leaves the node's box (plus a small gap). */
function exitPoint(node: MapNode, target: Point): Point {
  const centre = centreOf(node);
  const dx = target.x - centre.x;
  const dy = target.y - centre.y;
  const halfWidth = node.width / 2 + EDGE_GAP;
  const halfHeight = node.height / 2 + EDGE_GAP;
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx),
    dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy),
  );
  // Both zero only when the target is the centre itself, which callers rule out.
  return Number.isFinite(scale) ? { x: centre.x + dx * scale, y: centre.y + dy * scale } : centre;
}

interface Curve {
  start: Point;
  control: Point;
  end: Point;
}

/** A quadratic curve between the edges of two boxes whose midpoint sits `bow` to the right of the straight line. */
function curveBetween(from: MapNode, to: MapNode, bow: number): Curve {
  const a = centreOf(from);
  const b = centreOf(to);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  // Unit vector pointing to the right of the direction of travel.
  const right = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
  // A quadratic curve reaches half of its control point's offset, hence the factor of two.
  const control = { x: (a.x + b.x) / 2 + right.x * bow * 2, y: (a.y + b.y) / 2 + right.y * bow * 2 };
  return { start: exitPoint(from, control), control, end: exitPoint(to, control) };
}

function pointOn({ start, control, end }: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
  };
}

/** How many sample points along the curve leave the map or come too close to a box in `obstacles`. 0 is a clean run. */
function collisions(curve: Curve, obstacles: MapNode[], width: number, height: number): number {
  let count = 0;
  for (let sample = 0; sample <= CURVE_SAMPLES; sample++) {
    const { x, y } = pointOn(curve, sample / CURVE_SAMPLES);
    const outside = x < 0 || y < 0 || x > width || y > height;
    const blocked = obstacles.some(
      (box) =>
        x > box.x - EDGE_CLEARANCE &&
        x < box.x + box.width + EDGE_CLEARANCE &&
        y > box.y - EDGE_CLEARANCE &&
        y < box.y + box.height + EDGE_CLEARANCE,
    );
    if (outside || blocked) count++;
  }
  return count;
}

function toPath({ start, control, end }: Curve): string {
  return `M${round(start.x)} ${round(start.y)}Q${round(control.x)} ${round(control.y)} ${round(end.x)} ${round(end.y)}`;
}

/**
 * Lays out the map. `positions` should already be in display order (as in `Library.positions`);
 * that order is kept within each lane.
 *
 * Not drawn: submissions (counted on their starting position), techniques whose start or end
 * position does not exist, and techniques that start and end in the same position.
 */
export function layoutPositionMap(
  positions: Position[],
  transitions: Transition[],
  orientation: MapOrientation,
): MapLayout {
  const g = GEOMETRY[orientation];
  const horizontal = orientation === 'horizontal';
  // Along the main axis lanes follow one another; along the cross axis a lane's positions sit side by side.
  const mainSize = horizontal ? g.nodeWidth : g.nodeHeight;
  const crossSize = horizontal ? g.nodeHeight : g.nodeWidth;
  // Headings sit above the positions: one shared band over the columns, or a band at the top of every row.
  const mainHeading = horizontal ? 0 : g.headingBand;
  const crossHeading = horizontal ? g.headingBand : 0;

  const categories = [...new Set(positions.map((p) => p.category))].sort((a, b) => LANE_RANK[a] - LANE_RANK[b]);
  const laneMembers = categories.map((category) => positions.filter((p) => p.category === category));
  const longestLane = Math.max(g.minLaneSlots, ...laneMembers.map((members) => members.length));
  const crossExtent = crossHeading + longestLane * crossSize + Math.max(0, longestLane - 1) * g.nodeGap;
  const mainExtent = categories.length * (mainHeading + mainSize) + Math.max(0, categories.length - 1) * g.laneGap;

  const submissionsFrom = new Map<string, number>();
  for (const t of transitions) {
    if (t.type === 'submission') submissionsFrom.set(t.fromId, (submissionsFrom.get(t.fromId) ?? 0) + 1);
  }

  const lanes: MapLane[] = [];
  const nodes: MapNode[] = [];
  laneMembers.forEach((members, laneIndex) => {
    const category = members[0]?.category;
    if (!category) return;
    const laneStart = g.padding + laneIndex * (mainHeading + mainSize + g.laneGap);
    const main = laneStart + mainHeading;
    const laneCross = members.length * crossSize + (members.length - 1) * g.nodeGap;
    // Shorter lanes are centred against the longest one.
    const crossStart = g.padding + crossHeading + (crossExtent - crossHeading - laneCross) / 2;
    lanes.push({
      category,
      labelX: round(horizontal ? main + mainSize / 2 : g.padding),
      labelY: round(horizontal ? g.padding : laneStart),
    });
    members.forEach((position, index) => {
      const cross = crossStart + index * (crossSize + g.nodeGap);
      nodes.push({
        id: position.id,
        category,
        x: round(horizontal ? main : cross),
        y: round(horizontal ? cross : main),
        width: g.nodeWidth,
        height: g.nodeHeight,
        submissions: submissionsFrom.get(position.id) ?? 0,
      });
    });
  });

  const width = round((horizontal ? mainExtent : crossExtent) + g.padding * 2);
  const height = round((horizontal ? crossExtent : mainExtent) + g.padding * 2);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  // Bows already used between each pair of positions, measured in one shared direction so that
  // an arrow and its return trip cannot land on the same curve.
  const takenBows = new Map<string, Set<number>>();
  const edges: MapEdge[] = [];
  for (const t of transitions) {
    if (t.type === 'submission' || t.fromId === t.toId) continue;
    const from = nodeById.get(t.fromId);
    const to = nodeById.get(t.toId);
    if (!from || !to) continue;
    const forwards = t.fromId < t.toId;
    const pair = forwards ? `${t.fromId}|${t.toId}` : `${t.toId}|${t.fromId}`;
    const taken = takenBows.get(pair) ?? new Set<number>();
    takenBows.set(pair, taken);
    const obstacles = nodes.filter((node) => node !== from && node !== to);
    // Gentlest first, so among equally clean curves the straightest wins.
    let bow = EDGE_BOW;
    let fewest = Number.POSITIVE_INFINITY;
    for (const candidate of BOW_CANDIDATES) {
      if (taken.has(forwards ? candidate : -candidate)) continue;
      const hits = collisions(curveBetween(from, to, candidate), obstacles, width, height);
      if (hits < fewest) {
        bow = candidate;
        fewest = hits;
      }
      if (hits === 0) break;
    }
    taken.add(forwards ? bow : -bow);
    edges.push({
      id: t.id,
      fromId: t.fromId,
      toId: t.toId,
      type: t.type,
      bow,
      path: toPath(curveBetween(from, to, bow)),
    });
  }

  return { width, height, lanes, nodes, edges };
}
