import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './motion';

/** How long a number takes to roll to its new value. */
const COUNT_UP_MS = 700;

/** Animates a displayed number towards `target`. Jumps straight there when the user prefers reduced motion. */
export function useCountUp(target: number): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? target : 0));
  const shownRef = useRef(shown);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;
    if (prefersReducedMotion()) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function step(time) {
      const progress = Math.min(1, (time - startedAt) / COUNT_UP_MS);
      // Ease-out cubic: fast at first, settling gently on the final value.
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}
