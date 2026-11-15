import { describe, expect, it } from 'vitest';
import { arrowPath, type FigurePose, figureParts, pointOnSpine } from './figure';

const standing: FigurePose = {
  head: [100, 35],
  neck: [100, 50],
  hip: [100, 100],
  face: 1,
  arms: {
    far: [
      [90, 70],
      [90, 90],
    ],
    near: [
      [110, 70],
      [110, 90],
    ],
  },
  legs: {
    far: [
      [95, 130],
      [95, 160],
    ],
    near: [
      [105, 130],
      [105, 160],
    ],
  },
};

describe('pointOnSpine', () => {
  it('runs from the neck to the hip', () => {
    expect(pointOnSpine(standing, 0)).toEqual([100, 50]);
    expect(pointOnSpine(standing, 1)).toEqual([100, 100]);
  });

  it('is straight when the pose gives no spine point', () => {
    expect(pointOnSpine(standing, 0.5)).toEqual([100, 75]);
  });

  it('bends towards the spine point', () => {
    const hunched: FigurePose = { ...standing, spine: [140, 75] };
    const [x, y] = pointOnSpine(hunched, 0.5);
    expect(x).toBeCloseTo(120);
    expect(y).toBeCloseTo(75);
  });
});

describe('figureParts', () => {
  const parts = figureParts(standing);

  it('hangs the legs from the hip and the arms from just below the neck', () => {
    expect(parts.limbs.nearLeg.path).toBe('M100 100 L105 130 L105 160');
    expect(parts.limbs.nearArm.path).toBe('M100 53 L110 70 L110 90');
    expect(parts.limbs.nearArm.end).toEqual([110, 90]);
  });

  it('puts the belt on the lower part of the spine', () => {
    expect(parts.belt).toBe('M100 87 L100 93');
  });

  it('puts the hair on the back of the head, away from the face', () => {
    // Standing and looking right: the cap runs from behind the ear, over the crown, to the brow.
    expect(parts.hair).toBe('M89.3 37.5 A11 11 0 0 1 108.8 28.4 Z');
    const leftLooking = figureParts({ ...standing, face: -1 }).hair;
    expect(leftLooking).not.toBe(parts.hair);
  });
});

describe('arrowPath', () => {
  it('draws a straight shaft with a head that opens back along it', () => {
    // 9 long sides at 32 degrees: 7.6 back along the shaft, 4.8 to either side.
    expect(arrowPath([0, 0], [100, 0])).toBe('M0 0 Q50 0 100 0 M92.4 -4.8 L100 0 L92.4 4.8');
  });

  it('bows the shaft by the bend and turns the head to follow the curve', () => {
    const d = arrowPath([0, 0], [100, 0], 10);
    // The curve's midpoint is halfway to the control point: 10 above the straight line.
    expect(d.startsWith('M0 0 Q50 -20 100 0 ')).toBe(true);
    expect(d).not.toContain('M92.4 -4.8');
  });

  it('copes with a zero-length arrow', () => {
    expect(arrowPath([5, 5], [5, 5])).not.toContain('NaN');
  });
});
