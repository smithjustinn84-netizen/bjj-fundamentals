/** The app's logo: a small tied belt. Colours come from `.brand-mark` so it follows the theme. */
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 34 22" aria-hidden="true">
      <path className="brand-mark-cloth" d="m15.5 9-4.5 10 3.8 1.5L18 11zM18.5 9l4.5 10-3.8 1.5L16 11z" />
      <rect className="brand-mark-cloth" x="1" y="5" width="32" height="6" rx="1.5" />
      <rect className="brand-mark-bar" x="24" y="5" width="6" height="6" />
      <rect className="brand-mark-cloth" x="13.5" y="3" width="7" height="10" rx="2" />
    </svg>
  );
}
