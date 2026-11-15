import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './motion';

/**
 * Runs once from 0 to 1 over `durationMs`, after waiting `delayMs`, starting when the component mounts.
 * Remount the component (change its `key`) to play again. Starts at 1 when the user prefers reduced motion.
 */
export function useTween(durationMs: number, delayMs: number): number {
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const startsAt = performance.now() + delayMs;
    let frame = requestAnimationFrame(function step(time) {
      const next = Math.min(1, Math.max(0, (time - startsAt) / durationMs));
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [durationMs, delayMs]);

  return progress;
}
