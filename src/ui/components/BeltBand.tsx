import { BELT_LABELS } from '../../core/labels';
import type { BeltRank } from '../../core/models';
import { MAX_STRIPES } from '../../core/rank';

/** A length of belt in the rank's colour, with a place on its bar for every stripe and tape on the earned ones. */
export function BeltBand({ rank, stripes }: { rank: BeltRank; stripes: number }) {
  return (
    <div
      className={`belt-band belt-${rank}`}
      role="img"
      aria-label={`${BELT_LABELS[rank]}, ${stripes} of ${MAX_STRIPES} stripes`}
    >
      <span className="belt-band-bar">
        {Array.from({ length: MAX_STRIPES }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the places are identical and their number never changes
            key={index}
            className={index < stripes ? 'belt-band-stripe earned' : 'belt-band-stripe'}
          />
        ))}
      </span>
    </div>
  );
}
