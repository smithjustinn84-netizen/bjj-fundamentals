/**
 * The size classes, for scripts that must know which one the window is in (`useMediaQuery`).
 * The same widths are written out in the stylesheets; `styles/tokens.css` lists all three and what
 * each one means. Like the stylesheets, a query here only ever asks "at least this wide"; add the
 * 900px and 1100px ones when a script first needs them.
 */
export const TABLET_UP = '(min-width: 600px)';
