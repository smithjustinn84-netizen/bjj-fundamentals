import { describe, expect, it } from 'vitest';
import { arrowPath, type FigurePose, figureParts, liftPose, type Point, pointOnSpine, tweenPose } from './figure';

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

describe('tweenPose', () => {
  /** The standing pose laid on its back with the head to the left: every segment a quarter turn anticlockwise on screen. */
  const lying: FigurePose = {
    head: [35, 200],
    neck: [50, 200],
    hip: [100, 200],
    face: -1,
    arms: {
      far: [
        [70, 210],
        [90, 210],
      ],
      near: [
        [70, 190],
        [90, 190],
      ],
    },
    legs: {
      far: [
        [130, 205],
        [160, 205],
      ],
      near: [
        [130, 195],
        [160, 195],
      ],
    },
  };
  const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  it('is the first pose at the start and the second at the end', () => {
    expect(tweenPose(standing, lying, 0)).toBe(standing);
    expect(tweenPose(standing, lying, 1)).toBe(lying);
  });

  it('moves the hips in a straight line', () => {
    expect(tweenPose(standing, lying, 0.5).hip).toEqual([100, 150]);
  });

  it('keeps the body its own size while it turns', () => {
    const half = tweenPose(standing, lying, 0.5);
    expect(distance(half.neck, half.hip)).toBeCloseTo(50);
    expect(distance(half.head, half.neck)).toBeCloseTo(15);
    expect(distance(half.legs.near[0], half.legs.near[1])).toBeCloseTo(30);
    expect(distance(half.arms.far[0], half.arms.far[1])).toBeCloseTo(20);
  });

  it('turns a segment the short way round', () => {
    // A lower leg pointing just above "left" swings to just below it: 20 degrees through left, not 340 through right.
    const withLeg = (foot: Point): FigurePose => ({
      ...standing,
      legs: { ...standing.legs, near: [[105, 130], foot] },
    });
    const half = tweenPose(withLeg([75.5, 124.8]), withLeg([75.5, 135.2]), 0.5);
    expect(half.legs.near[1][0]).toBeCloseTo(75, 0);
    expect(half.legs.near[1][1]).toBeCloseTo(130);
  });

  it('turns the face halfway through', () => {
    expect(tweenPose(standing, lying, 0.49).face).toBe(1);
    expect(tweenPose(standing, lying, 0.5).face).toBe(-1);
  });

  it('gives a spine point only when one of the poses bends', () => {
    expect(tweenPose(standing, lying, 0.5).spine).toBeUndefined();
    const hunched: FigurePose = { ...standing, spine: [80, 75] };
    const half = tweenPose(standing, hunched, 0.5);
    expect(half.spine?.[0]).toBeCloseTo(90);
    expect(half.spine?.[1]).toBeCloseTo(75);
  });
});

describe('liftPose', () => {
  it('leaves a pose alone when nothing is below the floor', () => {
    expect(liftPose(standing, 160)).toBe(standing);
  });

  it('raises the whole body until its lowest joint is on the floor', () => {
    const lifted = liftPose({ ...standing, spine: [95, 75] }, 150);
    expect(lifted.legs.near[1]).toEqual([105, 150]);
    expect(lifted.head).toEqual([100, 25]);
    expect(lifted.spine).toEqual([95, 65]);
    expect(lifted.arms.far[0]).toEqual([90, 60]);
  });
});
