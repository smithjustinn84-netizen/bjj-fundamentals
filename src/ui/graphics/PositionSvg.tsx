import type { ReactNode } from 'react';
import type { FigurePose } from '../../core/figure';
import { Arrow, Diagram } from './Diagram';
import { Figure } from './Figure';

/* Poses are joint positions in the shared diagram space (see Diagram.tsx). */

const HALF_GUARD_BOTTOM: FigurePose = {
  head: [92, 180],
  neck: [106, 182],
  hip: [158, 183],
  face: 1,
  arms: {
    far: [
      [124, 164],
      [146, 150],
    ],
    near: [
      [126, 168],
      [150, 158],
    ],
  },
  legs: {
    far: [
      [196, 188],
      [228, 190],
    ],
    near: [
      [194, 168],
      [226, 180],
    ],
  },
};
const HALF_GUARD_TOP: FigurePose = {
  head: [128, 121],
  neck: [142, 128],
  hip: [190, 146],
  face: -1,
  arms: {
    far: [
      [130, 152],
      [112, 168],
    ],
    near: [
      [136, 154],
      [116, 172],
    ],
  },
  legs: {
    far: [
      [228, 160],
      [250, 190],
    ],
    near: [
      [204, 180],
      [244, 184],
    ],
  },
};

const TURTLED: FigurePose = {
  head: [118, 172],
  neck: [130, 162],
  spine: [160, 128],
  hip: [196, 156],
  face: -1,
  arms: {
    far: [
      [150, 184],
      [128, 190],
    ],
    near: [
      [146, 182],
      [124, 190],
    ],
  },
  legs: {
    far: [
      [176, 188],
      [212, 190],
    ],
    near: [
      [172, 188],
      [208, 190],
    ],
  },
};
const ON_THE_TURTLE: FigurePose = {
  head: [150, 104],
  neck: [164, 110],
  hip: [216, 120],
  face: -1,
  arms: {
    far: [
      [152, 136],
      [140, 158],
    ],
    near: [
      [160, 140],
      [150, 166],
    ],
  },
  legs: {
    far: [
      [250, 156],
      [282, 190],
    ],
    near: [
      [246, 160],
      [276, 190],
    ],
  },
};

const POSITION_SCENES: Record<string, () => ReactNode> = {
  'half-guard': () => (
    <>
      <Figure pose={HALF_GUARD_BOTTOM} gi="light" parts={['farLeg', 'farArm', 'body']} />
      <Figure pose={HALF_GUARD_TOP} gi="dark" />
      {/* The bottom person's top leg closes over the trapped shin. */}
      <Figure pose={HALF_GUARD_BOTTOM} gi="light" parts={['nearLeg', 'nearArm']} />
      <circle className="dgm-ring" cx="216" cy="180" r="27" />
    </>
  ),
  turtle: () => (
    <>
      <Figure pose={TURTLED} gi="light" />
      <Figure pose={ON_THE_TURTLE} gi="dark" />
      <Arrow from={[200, 62]} to={[200, 92]} />
    </>
  ),
};

export function hasPositionSvg(id: string): boolean {
  return id in POSITION_SCENES;
}

export function PositionSvg({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const draw = POSITION_SCENES[id];
  if (!draw) return null;
  return (
    <Diagram label={`Diagram of ${name}`} shape="tall" className={`position-artwork ${className}`.trim()}>
      {draw()}
    </Diagram>
  );
}
