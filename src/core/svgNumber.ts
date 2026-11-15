/** One decimal place: precise enough for an SVG coordinate, short enough to keep path strings readable. */
const SCALE = 10;

/** Rounds an SVG coordinate or length to one decimal place. */
export function roundSvg(value: number): number {
  return Math.round(value * SCALE) / SCALE;
}
