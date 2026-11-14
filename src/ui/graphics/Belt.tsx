import { BELT_LABELS } from '../../core/labels';
import type { BeltRank } from '../../core/models';

/** Where the first stripe sits on the rank bar, and how far apart stripes are, in SVG units. */
const FIRST_STRIPE_X = 153;
const STRIPE_SPACING = 7;

/** A tied belt in the colour of the given rank, with earned stripes on its rank bar. */
export function Belt({ rank, stripes }: { rank: BeltRank; stripes: number }) {
  const label = `${BELT_LABELS[rank]}${stripes > 0 ? `, ${stripes} stripe${stripes === 1 ? '' : 's'}` : ''}`;
  return (
    <svg className={`belt-art belt-${rank}`} viewBox="0 0 200 84" role="img" aria-label={label}>
      <path className="belt-cloth" d="M96 36 76 74l15 6 14-38zM104 36l20 38-15 6-14-38z" />
      <rect className="belt-cloth" x="4" y="22" width="192" height="18" rx="3" />
      <rect className="belt-bar" x="146" y="22" width="38" height="18" />
      {Array.from({ length: stripes }, (_, index) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: stripes are identical and only ever added or removed at the end
          key={index}
          className="belt-stripe"
          x={FIRST_STRIPE_X + index * STRIPE_SPACING}
          y="22"
          width="3"
          height="18"
        />
      ))}
      <rect className="belt-cloth belt-knot" x="88" y="17" width="24" height="28" rx="6" />
      <path className="belt-fold" d="M94 24c4 3 8 3 12 0M94 38c4-3 8-3 12 0" />
    </svg>
  );
}
