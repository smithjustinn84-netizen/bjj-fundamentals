import type { ReactNode } from 'react';
import type { FigurePose } from '../../core/figure';
import { Arrow, Diagram } from './Diagram';
import { Figure } from './Figure';

/*
 * Poses are joint positions in the shared diagram space (see Diagram.tsx). Lying figures keep their
 * spine about 13 above the mat and their feet 6 above it, so cloth rests on the line.
 */

/* Face down with one arm free to slap the mat: the tap has to be seen as well as felt. */
const TAPPING: FigurePose = {
  head: [158, 180],
  neck: [173, 183],
  hip: [225, 184],
  face: -1,
  arms: {
    far: [
      [160, 188],
      [142, 190],
    ],
    near: [
      [150, 170],
      [124, 189],
    ],
  },
  legs: {
    far: [
      [262, 186],
      [298, 190],
    ],
    near: [
      [258, 187],
      [294, 190],
    ],
  },
};

const KNEELING_TALL: FigurePose = {
  head: [113, 90],
  neck: [112, 105],
  hip: [112, 157],
  face: 1,
  arms: {
    far: [
      [124, 128],
      [142, 144],
    ],
    near: [
      [120, 132],
      [138, 152],
    ],
  },
  legs: {
    far: [
      [140, 188],
      [104, 190],
    ],
    near: [
      [134, 188],
      [98, 190],
    ],
  },
};
const KNEELING_HUNCHED: FigurePose = {
  head: [324, 138],
  neck: [311, 128],
  spine: [282, 116],
  hip: [272, 157],
  face: 1,
  arms: {
    far: [
      [320, 152],
      [336, 172],
    ],
    near: [
      [314, 154],
      [328, 176],
    ],
  },
  legs: {
    far: [
      [300, 188],
      [264, 190],
    ],
    near: [
      [294, 188],
      [258, 190],
    ],
  },
};

const WIDE_STANCE: FigurePose = {
  head: [200, 52],
  neck: [200, 67],
  hip: [200, 122],
  face: 1,
  arms: {
    far: [
      [176, 90],
      [166, 114],
    ],
    near: [
      [224, 90],
      [234, 114],
    ],
  },
  legs: {
    far: [
      [170, 152],
      [146, 190],
    ],
    near: [
      [230, 152],
      [254, 190],
    ],
  },
};

const FRAMING: FigurePose = {
  head: [80, 182],
  neck: [95, 183],
  hip: [147, 184],
  face: 1,
  arms: {
    far: [
      [118, 166],
      [148, 158],
    ],
    near: [
      [112, 159],
      [136, 137],
    ],
  },
  legs: {
    far: [
      [178, 162],
      [208, 182],
    ],
    near: [
      [176, 156],
      [206, 176],
    ],
  },
};
const LEANING_IN: FigurePose = {
  head: [137, 118],
  neck: [150, 125],
  hip: [196, 157],
  face: -1,
  arms: {
    far: [
      [142, 150],
      [126, 170],
    ],
    near: [
      [152, 152],
      [134, 176],
    ],
  },
  legs: {
    far: [
      [176, 188],
      [214, 190],
    ],
    near: [
      [172, 188],
      [210, 190],
    ],
  },
};

/* Seen from above: flat on the back, then curled with the hips slid away. */
const BEFORE_SHRIMP: FigurePose = {
  head: [126, 84],
  neck: [140, 90],
  hip: [196, 100],
  face: 1,
  arms: {
    far: [
      [158, 72],
      [180, 62],
    ],
    near: [
      [160, 110],
      [184, 116],
    ],
  },
  legs: {
    far: [
      [234, 92],
      [270, 96],
    ],
    near: [
      [234, 110],
      [270, 116],
    ],
  },
};
const AFTER_SHRIMP: FigurePose = {
  head: [126, 84],
  neck: [140, 90],
  spine: [164, 100],
  hip: [184, 136],
  face: 1,
  arms: {
    far: [
      [162, 72],
      [186, 62],
    ],
    near: [
      [170, 84],
      [196, 78],
    ],
  },
  legs: {
    far: [
      [222, 118],
      [252, 100],
    ],
    near: [
      [222, 150],
      [258, 158],
    ],
  },
};

const BRIDGING: FigurePose = {
  head: [96, 182],
  neck: [110, 176],
  spine: [128, 146],
  hip: [160, 142],
  face: 1,
  arms: {
    far: [
      [128, 186],
      [150, 190],
    ],
    near: [
      [130, 188],
      [154, 191],
    ],
  },
  legs: {
    far: [
      [196, 152],
      [204, 190],
    ],
    near: [
      [192, 154],
      [198, 190],
    ],
  },
};

const ELBOWS_TUCKED: FigurePose = {
  head: [200, 46],
  neck: [200, 61],
  hip: [200, 116],
  face: 1,
  arms: {
    far: [
      [182, 94],
      [190, 70],
    ],
    near: [
      [218, 94],
      [210, 70],
    ],
  },
  legs: {
    far: [
      [180, 152],
      [176, 190],
    ],
    near: [
      [220, 152],
      [224, 190],
    ],
  },
};

const UNDERHOOKING: FigurePose = {
  head: [182, 60],
  neck: [173, 73],
  hip: [150, 122],
  face: 1,
  arms: {
    far: [
      [196, 92],
      [216, 80],
    ],
    near: [
      [200, 98],
      [236, 96],
    ],
  },
  legs: {
    far: [
      [136, 156],
      [118, 190],
    ],
    near: [
      [164, 154],
      [156, 190],
    ],
  },
};
const UNDERHOOKED: FigurePose = {
  head: [226, 60],
  neck: [235, 73],
  hip: [258, 122],
  face: -1,
  arms: {
    far: [
      [214, 88],
      [196, 104],
    ],
    near: [
      [210, 82],
      [188, 84],
    ],
  },
  legs: {
    far: [
      [272, 156],
      [290, 190],
    ],
    near: [
      [244, 154],
      [252, 190],
    ],
  },
};

const PINNED: FigurePose = {
  head: [96, 182],
  neck: [111, 183],
  hip: [163, 184],
  face: 1,
  arms: {
    far: [
      [130, 170],
      [150, 160],
    ],
    near: [
      [128, 186],
      [150, 190],
    ],
  },
  legs: {
    far: [
      [198, 174],
      [230, 190],
    ],
    near: [
      [196, 170],
      [226, 190],
    ],
  },
};
const PRESSING: FigurePose = {
  head: [128, 158],
  neck: [142, 162],
  hip: [194, 150],
  face: -1,
  arms: {
    far: [
      [150, 180],
      [130, 188],
    ],
    near: [
      [156, 182],
      [134, 190],
    ],
  },
  legs: {
    far: [
      [232, 168],
      [268, 190],
    ],
    near: [
      [230, 166],
      [264, 190],
    ],
  },
};

interface Scene {
  view?: 'side' | 'above';
  draw: () => ReactNode;
}

const CONCEPT_SCENES: Record<string, Scene> = {
  safety: {
    draw: () => (
      <>
        <Figure pose={TAPPING} gi="light" />
        {/* The tap: rings spreading across the mat from the hand. */}
        <ellipse className="dgm-ring" cx="122" cy="196" rx="20" ry="5" />
        <ellipse className="dgm-ring" cx="122" cy="196" rx="36" ry="9" />
        <Arrow from={[104, 140]} to={[116, 174]} bend={8} />
      </>
    ),
  },
  posture: {
    draw: () => (
      <>
        <line className="dgm-guide" x1="112" y1="62" x2="112" y2="192" />
        <Figure pose={KNEELING_TALL} gi="dark" />
        <path className="dgm-good" d="M146 78 l8 9 l15 -19" />
        <Figure pose={KNEELING_HUNCHED} gi="light" />
        <path className="dgm-bad" d="M342 92 l15 15 M357 92 l-15 15" />
      </>
    ),
  },
  base: {
    draw: () => (
      <>
        {/* The triangle between the feet and the hips: stay inside it and you stay up. */}
        <polygon className="dgm-zone" points="200,122 140,195 260,195" />
        <Figure pose={WIDE_STANCE} gi="dark" />
        <line className="dgm-guide" x1="200" y1="126" x2="200" y2="194" />
        <circle className="dgm-dot" cx="146" cy="196" r="5" />
        <circle className="dgm-dot" cx="254" cy="196" r="5" />
      </>
    ),
  },
  frames: {
    draw: () => (
      <>
        <Figure pose={FRAMING} gi="light" parts={['farLeg', 'farArm', 'body']} />
        <Figure pose={LEANING_IN} gi="dark" />
        <Figure pose={FRAMING} gi="light" parts={['nearLeg', 'nearArm']} />
        {/* The forearm is the frame: bone, not muscle, holds the weight. */}
        <path className="dgm-bone" d="M112 159 L136 137" />
        <Arrow from={[186, 88]} to={[160, 110]} />
      </>
    ),
  },
  'hip-escape': {
    view: 'above',
    draw: () => (
      <>
        <g className="dgm-ghost">
          <Figure pose={BEFORE_SHRIMP} gi="light" />
        </g>
        <Figure pose={AFTER_SHRIMP} gi="light" />
        <Arrow from={[204, 76]} to={[176, 164]} bend={-34} />
      </>
    ),
  },
  bridge: {
    draw: () => (
      <>
        <Figure pose={BRIDGING} gi="light" />
        <Arrow from={[158, 190]} to={[158, 164]} />
      </>
    ),
  },
  'elbows-in': {
    draw: () => (
      <>
        <Figure pose={ELBOWS_TUCKED} gi="light" />
        <rect className="dgm-zone" x="170" y="60" width="60" height="50" rx="10" />
        <Arrow from={[132, 92]} to={[164, 92]} />
        <Arrow from={[268, 92]} to={[236, 92]} />
      </>
    ),
  },
  underhooks: {
    draw: () => (
      <>
        <Figure pose={UNDERHOOKED} gi="dark" />
        <Figure pose={UNDERHOOKING} gi="light" />
        <path className="dgm-bone" d="M176 78 L200 98 L236 96" />
        <Arrow from={[212, 142]} to={[212, 114]} />
      </>
    ),
  },
  grips: {
    draw: () => (
      <>
        <path
          className="dgm-gi"
          d="M152 68 L186 56 L200 100 L214 56 L248 68 L268 116 L242 130 L236 110 L236 190 L164 190 L164 110 L158 130 L132 116 Z"
        />
        <path className="dgm-seam" d="M186 56 L206 146 M214 56 L200 100" />
        <path className="dgm-gi-belt" d="M164 152 L236 152" />
        {/* The two grips a beginner needs first: collar and sleeve. */}
        <circle className="dgm-ring" cx="190" cy="96" r="13" />
        <circle className="dgm-dot" cx="190" cy="96" r="5" />
        <circle className="dgm-ring" cx="252" cy="120" r="13" />
        <circle className="dgm-dot" cx="252" cy="120" r="5" />
      </>
    ),
  },
  pressure: {
    draw: () => (
      <>
        <Figure pose={PINNED} gi="light" />
        <Figure pose={PRESSING} gi="dark" />
        <Arrow from={[158, 104]} to={[158, 134]} />
        <Arrow from={[184, 98]} to={[184, 128]} />
      </>
    ),
  },
};

/** Someone tapping out, framed like a position picture: where a submission ends. */
export function TapArtwork({ className = '' }: { className?: string }) {
  return (
    <Diagram label="Diagram of a tap on the mat" shape="tall" className={`position-artwork ${className}`.trim()}>
      {CONCEPT_SCENES.safety?.draw()}
    </Diagram>
  );
}

export function ConceptArtwork({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const scene = CONCEPT_SCENES[id];
  if (!scene) return null;
  return (
    <Diagram
      label={`Diagram of ${name}`}
      shape="wide"
      view={scene.view}
      className={`concept-artwork ${className}`.trim()}
    >
      {scene.draw()}
    </Diagram>
  );
}
