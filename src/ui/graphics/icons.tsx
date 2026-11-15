import type { ReactNode } from 'react';

/** Line icons drawn on a 24x24 grid. Stroke and size come from the `.icon` class and the surrounding text. */
const ICONS = {
  concepts: (
    <>
      <path d="M4 5.5c2.5-1 5.5-1 8 .5 2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" />
      <path d="M12 6v13" />
    </>
  ),
  map: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <circle cx="9" cy="18" r="2.5" />
      <path d="m8.4 6.5 7.1 1M6.6 8.4l1.8 7.2M16.3 9.9l-5.6 6.3" />
    </>
  ),
  review: (
    <>
      <rect x="4" y="8" width="13" height="11" rx="2" />
      <path d="M8 5h10a2 2 0 0 1 2 2v9" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5v5l4-2.5z" />
    </>
  ),
  backup: (
    <>
      <path d="M12 4v10m0 0-3.5-3.5M12 14l3.5-3.5" />
      <path d="M5 16v2.5h14V16" />
    </>
  ),
  belt: (
    <>
      <rect x="3" y="8" width="18" height="5" rx="1" />
      <path d="M10 8v5M14 8v5M10.5 13 8 20M13.5 13l2.5 7" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-6.5 8 6.5" />
      <path d="M6 9.5V19h12V9.5" />
    </>
  ),
  log: (
    <>
      <rect x="4.5" y="5" width="15" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4.5 10h15M8.5 14.5l2.3 2.3 4.7-4.6" />
    </>
  ),
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .2 1.6 1 2.4 1.8 2.6C10.5 9 11 5.5 12 3z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14m0 0-5-5m5 5-5 5" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

/** Always decorative: put the meaning in nearby text. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
