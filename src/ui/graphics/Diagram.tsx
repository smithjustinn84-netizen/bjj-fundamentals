import type { ReactNode } from 'react';
import { arrowPath, type Point } from '../../core/figure';

/**
 * Every scene is drawn in the same space with the mat at y = 196 and the action centred on x = 200,
 * so figures are one size everywhere. `wide` is a 16:9 window on it; `tall` is a closer 4:3 window
 * for position pictures.
 */
const VIEW_BOX = { wide: '40 28 320 180', tall: '70 13 260 195' } as const;
/** The mat seen from overhead, sized to sit just inside each window. */
const MAT_FROM_ABOVE = {
  wide: { x: 64, y: 40, width: 272, height: 156 },
  tall: { x: 82, y: 24, width: 236, height: 178 },
} as const;
type DiagramShape = keyof typeof VIEW_BOX;

/** Where the mat is, for scenes to stand their figures on. */
const MAT_Y = 196;

/** A scene on paper. `view` is 'side' for the usual mat line, 'above' for a mat seen from overhead. */
export function Diagram({
  label,
  shape,
  view = 'side',
  className = '',
  children,
}: {
  label: string;
  shape: DiagramShape;
  view?: 'side' | 'above';
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={`artwork-frame ${className}`.trim()}>
      <svg className="diagram-svg" viewBox={VIEW_BOX[shape]} role="img" aria-label={label}>
        {view === 'side' ? (
          <>
            <ellipse className="dgm-shadow" cx="200" cy={MAT_Y + 2} rx="120" ry="6" />
            <line className="dgm-mat" x1="60" y1={MAT_Y} x2="340" y2={MAT_Y} />
          </>
        ) : (
          <rect className="dgm-mat-fill" {...MAT_FROM_ABOVE[shape]} rx="6" />
        )}
        {children}
      </svg>
    </figure>
  );
}

/** A red arrow showing movement or force. */
export function Arrow({ from, to, bend }: { from: Point; to: Point; bend?: number }) {
  return <path className="dgm-arrow" d={arrowPath(from, to, bend)} />;
}
