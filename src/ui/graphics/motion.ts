/** True when the user has asked the system to minimise animation. CSS handles its own case; this is for scripted motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
