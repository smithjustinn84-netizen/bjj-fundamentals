import { FIGURE_SIZE, type FigurePose, figureParts, LIMB_NAMES, type LimbName } from '../../core/figure';

const BODY_PARTS = [...LIMB_NAMES, 'body'] as const;
type BodyPart = (typeof BODY_PARTS)[number];

/** Width of the ink line round every shape. */
const OUTLINE = 2.25;

const LIMB_WIDTH: Record<LimbName, number> = {
  farLeg: FIGURE_SIZE.legWidth,
  nearLeg: FIGURE_SIZE.legWidth,
  farArm: FIGURE_SIZE.armWidth,
  nearArm: FIGURE_SIZE.armWidth,
};
const LIMB_END_RADIUS: Record<LimbName, number> = {
  farLeg: FIGURE_SIZE.footRadius,
  nearLeg: FIGURE_SIZE.footRadius,
  farArm: FIGURE_SIZE.handRadius,
  nearArm: FIGURE_SIZE.handRadius,
};

/** A thick line with an ink edge: the ink goes down first, slightly wider, then the cloth on top. */
function Cloth({ d, width, className }: { d: string; width: number; className: string }) {
  return (
    <>
      <path className="fig-ink" d={d} strokeWidth={width + OUTLINE * 2} />
      <path className={className} d={d} strokeWidth={width} />
    </>
  );
}

/**
 * One jointed grappler. `gi` picks the cloth: the light gi wears the red belt, the dark gi a black one,
 * matching the painted illustrations. `parts` draws only some of the body, so a scene can put one
 * person's leg in front of the other person (half guard, back control hooks).
 */
export function Figure({
  pose,
  gi,
  parts = BODY_PARTS,
}: {
  pose: FigurePose;
  gi: 'light' | 'dark';
  parts?: readonly BodyPart[];
}) {
  const shape = figureParts(pose);
  const limb = (name: LimbName) => {
    if (!parts.includes(name)) return null;
    const { path, end } = shape.limbs[name];
    const far = name === 'farLeg' || name === 'farArm';
    return (
      <>
        <circle className="fig-skin" cx={end[0]} cy={end[1]} r={LIMB_END_RADIUS[name]} />
        <Cloth d={path} width={LIMB_WIDTH[name]} className={far ? 'fig-cloth fig-cloth-far' : 'fig-cloth'} />
      </>
    );
  };
  return (
    <g className={`fig fig-${gi}`}>
      {limb('farLeg')}
      {limb('farArm')}
      {parts.includes('body') && (
        <>
          <Cloth d={shape.torso} width={FIGURE_SIZE.torsoWidth} className="fig-cloth" />
          <path className="fig-belt" d={shape.belt} strokeWidth={FIGURE_SIZE.torsoWidth} />
          <circle className="fig-skin" cx={shape.head[0]} cy={shape.head[1]} r={FIGURE_SIZE.headRadius} />
          <path className="fig-hair" d={shape.hair} />
        </>
      )}
      {limb('nearLeg')}
      {limb('nearArm')}
    </g>
  );
}
