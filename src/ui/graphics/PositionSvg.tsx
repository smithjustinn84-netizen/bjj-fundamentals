import type { ReactNode } from 'react';
import type { FigurePose } from '../../core/figure';
import { Arrow, Diagram } from './Diagram';
import { type BodyPart, Figure } from './Figure';

/* Poses are joint positions in the shared diagram space (see Diagram.tsx). */

const STANDING_LEFT: FigurePose = {
  head: [166, 58],
  neck: [158, 72],
  hip: [142, 124],
  face: 1,
  arms: {
    far: [
      [182, 98],
      [206, 108],
    ],
    near: [
      [186, 88],
      [216, 80],
    ],
  },
  legs: {
    far: [
      [126, 158],
      [110, 190],
    ],
    near: [
      [156, 156],
      [152, 190],
    ],
  },
};
const STANDING_RIGHT: FigurePose = {
  head: [234, 58],
  neck: [242, 72],
  hip: [258, 124],
  face: -1,
  arms: {
    far: [
      [218, 88],
      [196, 82],
    ],
    near: [
      [214, 98],
      [186, 102],
    ],
  },
  legs: {
    far: [
      [274, 158],
      [290, 190],
    ],
    near: [
      [244, 156],
      [248, 190],
    ],
  },
};

const CLOSED_GUARD_BOTTOM: FigurePose = {
  head: [92, 182],
  neck: [107, 183],
  hip: [159, 184],
  face: 1,
  arms: {
    far: [
      [128, 164],
      [156, 152],
    ],
    near: [
      [124, 160],
      [150, 146],
    ],
  },
  legs: {
    far: [
      [198, 154],
      [232, 158],
    ],
    near: [
      [200, 146],
      [230, 150],
    ],
  },
};
const CLOSED_GUARD_TOP: FigurePose = {
  head: [166, 100],
  neck: [176, 112],
  hip: [206, 158],
  face: -1,
  arms: {
    far: [
      [158, 134],
      [140, 156],
    ],
    near: [
      [162, 138],
      [146, 162],
    ],
  },
  legs: {
    far: [
      [184, 188],
      [224, 190],
    ],
    near: [
      [180, 188],
      [220, 190],
    ],
  },
};

const OPEN_GUARD_BOTTOM: FigurePose = {
  head: [96, 178],
  neck: [110, 176],
  hip: [160, 184],
  face: 1,
  arms: {
    far: [
      [134, 162],
      [158, 154],
    ],
    near: [
      [130, 158],
      [154, 148],
    ],
  },
  legs: {
    far: [
      [194, 158],
      [226, 140],
    ],
    near: [
      [190, 150],
      [222, 130],
    ],
  },
};
const OPEN_GUARD_TOP: FigurePose = {
  head: [183, 98],
  neck: [196, 104],
  hip: [240, 126],
  face: -1,
  arms: {
    far: [
      [186, 126],
      [198, 156],
    ],
    near: [
      [190, 130],
      [192, 152],
    ],
  },
  legs: {
    far: [
      [262, 158],
      [270, 190],
    ],
    near: [
      [232, 160],
      [238, 190],
    ],
  },
};

/* Seen from above: one body along the mat, the other lying across its chest. */
const SIDE_CONTROL_BOTTOM: FigurePose = {
  head: [136, 100],
  neck: [151, 100],
  hip: [205, 100],
  face: 1,
  arms: {
    far: [
      [160, 80],
      [180, 70],
    ],
    near: [
      [162, 120],
      [146, 136],
    ],
  },
  legs: {
    far: [
      [240, 90],
      [276, 88],
    ],
    near: [
      [238, 112],
      [270, 126],
    ],
  },
};
const SIDE_CONTROL_TOP: FigurePose = {
  head: [168, 67],
  neck: [170, 82],
  hip: [178, 134],
  face: -1,
  arms: {
    far: [
      [196, 92],
      [214, 108],
    ],
    near: [
      [148, 84],
      [126, 92],
    ],
  },
  legs: {
    far: [
      [204, 158],
      [224, 184],
    ],
    near: [
      [160, 162],
      [144, 188],
    ],
  },
};

const MOUNT_BOTTOM: FigurePose = {
  head: [96, 182],
  neck: [111, 183],
  hip: [163, 184],
  face: 1,
  arms: {
    far: [
      [128, 166],
      [146, 154],
    ],
    near: [
      [132, 168],
      [152, 160],
    ],
  },
  legs: {
    far: [
      [200, 166],
      [224, 190],
    ],
    near: [
      [196, 160],
      [216, 190],
    ],
  },
};
const MOUNT_TOP: FigurePose = {
  head: [136, 93],
  neck: [140, 108],
  hip: [150, 160],
  face: -1,
  arms: {
    far: [
      [124, 126],
      [116, 150],
    ],
    near: [
      [128, 130],
      [122, 156],
    ],
  },
  legs: {
    far: [
      [130, 184],
      [170, 190],
    ],
    near: [
      [126, 184],
      [166, 190],
    ],
  },
};

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

/* Both sitting, facing right: the attacker behind, chest to back. */
const BACK_TAKEN: FigurePose = {
  head: [186, 116],
  neck: [181, 131],
  hip: [200, 181],
  face: 1,
  arms: {
    far: [
      [208, 150],
      [200, 138],
    ],
    near: [
      [206, 160],
      [198, 146],
    ],
  },
  legs: {
    far: [
      [242, 168],
      [272, 190],
    ],
    near: [
      [238, 162],
      [268, 190],
    ],
  },
};
const ON_THE_BACK: FigurePose = {
  head: [156, 110],
  neck: [150, 126],
  hip: [160, 181],
  face: 1,
  arms: {
    far: [
      [180, 150],
      [200, 160],
    ],
    near: [
      [184, 134],
      [198, 152],
    ],
  },
  legs: {
    far: [
      [208, 168],
      [232, 188],
    ],
    near: [
      [206, 160],
      [230, 186],
    ],
  },
};

type Gi = 'light' | 'dark';

/** One pass of the brush: some or all of one person. Later layers sit in front of earlier ones. */
interface SceneLayer {
  gi: Gi;
  parts?: readonly BodyPart[];
}

/**
 * A position as data, so that a technique can move the same two people from one scene to another.
 * The light gi is always the person underneath or being controlled.
 */
export interface PositionScene {
  view?: 'side' | 'above';
  light: FigurePose;
  dark: FigurePose;
  /** Drawing the same person twice with different `parts` puts one limb in front of the other person. */
  layers: readonly SceneLayer[];
  /** Marks that belong to the still picture: rings and arrows. */
  extras?: () => ReactNode;
}

const POSITION_SCENES: Record<string, PositionScene> = {
  standing: {
    light: STANDING_RIGHT,
    dark: STANDING_LEFT,
    // The collar grip reaches across in front of the other person.
    layers: [{ gi: 'dark' }, { gi: 'light' }, { gi: 'dark', parts: ['nearArm'] }],
  },
  'closed-guard': {
    light: CLOSED_GUARD_BOTTOM,
    dark: CLOSED_GUARD_TOP,
    // The near leg wraps the waist; the ankles cross behind the back.
    layers: [
      { gi: 'light', parts: ['farLeg', 'farArm', 'body'] },
      { gi: 'dark' },
      { gi: 'light', parts: ['nearLeg', 'nearArm'] },
    ],
  },
  'open-guard': {
    light: OPEN_GUARD_BOTTOM,
    dark: OPEN_GUARD_TOP,
    // Feet on the hips keep the distance.
    layers: [
      { gi: 'dark', parts: ['farLeg', 'farArm', 'body', 'nearLeg'] },
      { gi: 'light' },
      { gi: 'dark', parts: ['nearArm'] },
    ],
  },
  'side-control': {
    view: 'above',
    light: SIDE_CONTROL_BOTTOM,
    dark: SIDE_CONTROL_TOP,
    layers: [{ gi: 'light' }, { gi: 'dark' }],
  },
  mount: {
    light: MOUNT_BOTTOM,
    dark: MOUNT_TOP,
    layers: [
      { gi: 'light', parts: ['farLeg', 'farArm', 'body', 'nearLeg'] },
      { gi: 'dark' },
      { gi: 'light', parts: ['nearArm'] },
    ],
  },
  'half-guard': {
    light: HALF_GUARD_BOTTOM,
    dark: HALF_GUARD_TOP,
    // The bottom person's top leg closes over the trapped shin.
    layers: [
      { gi: 'light', parts: ['farLeg', 'farArm', 'body'] },
      { gi: 'dark' },
      { gi: 'light', parts: ['nearLeg', 'nearArm'] },
    ],
    extras: () => <circle className="dgm-ring" cx="216" cy="180" r="27" />,
  },
  'back-control': {
    light: BACK_TAKEN,
    dark: ON_THE_BACK,
    // The seatbelt arm crosses the chest and the hook sits inside the thigh, so both go on top.
    layers: [
      { gi: 'dark', parts: ['farLeg', 'farArm', 'body'] },
      { gi: 'light', parts: ['farLeg', 'farArm', 'body'] },
      { gi: 'dark', parts: ['nearLeg', 'nearArm'] },
      { gi: 'light', parts: ['nearLeg', 'nearArm'] },
    ],
  },
  turtle: {
    light: TURTLED,
    dark: ON_THE_TURTLE,
    layers: [{ gi: 'light' }, { gi: 'dark' }],
    extras: () => <Arrow from={[200, 62]} to={[200, 92]} />,
  },
};

/** The scene for a built-in position, or nothing for a position the user added. */
export function positionScene(id: string): PositionScene | undefined {
  return POSITION_SCENES[id];
}

/**
 * Draws a scene's layers. `people` says who is in each of the scene's two places and how they are
 * posed right now: the scene's own poses for a still picture, or poses part-way through a technique.
 */
export function SceneFigures({
  layers,
  people,
}: {
  layers: readonly SceneLayer[];
  people: Record<Gi, { pose: FigurePose; gi: Gi }>;
}) {
  return (
    <>
      {layers.map((layer, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a scene's layers are a fixed list that never reorders
        <Figure key={index} pose={people[layer.gi].pose} gi={people[layer.gi].gi} parts={layer.parts} />
      ))}
    </>
  );
}

/** A scene exactly as it is posed, without the paper behind it. */
export function StillScene({ scene }: { scene: PositionScene }) {
  return (
    <>
      <SceneFigures
        layers={scene.layers}
        people={{ light: { pose: scene.light, gi: 'light' }, dark: { pose: scene.dark, gi: 'dark' } }}
      />
      {scene.extras?.()}
    </>
  );
}

/** The picture for a built-in position. Draws nothing for a position the user added. */
export function PositionArtwork({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const scene = POSITION_SCENES[id];
  if (!scene) return null;
  return (
    <Diagram
      label={`Diagram of ${name}`}
      shape="tall"
      view={scene.view}
      className={`position-artwork ${className}`.trim()}
    >
      <StillScene scene={scene} />
    </Diagram>
  );
}
