import type { ReactNode } from 'react';

/** Ring geometry in SVG units. The radius leaves room for the stroke inside the 120-unit box. */
const BOX = 120;
const STROKE = 10;
const RADIUS = (BOX - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A circular progress meter. `children` are shown in the middle of the ring. */
export function ProgressRing({ percent, label, children }: { percent: number; label: string; children: ReactNode }) {
  const filled = (CIRCUMFERENCE * Math.min(100, Math.max(0, percent))) / 100;
  return (
    <div
      className="ring"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
        <circle className="ring-track" cx={BOX / 2} cy={BOX / 2} r={RADIUS} strokeWidth={STROKE} />
        {/* A zero-length stroke with round caps would still paint a dot, so draw nothing at 0%. */}
        {filled > 0 && (
          <circle
            className="ring-value"
            cx={BOX / 2}
            cy={BOX / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          />
        )}
      </svg>
      <div className="ring-centre">{children}</div>
    </div>
  );
}
