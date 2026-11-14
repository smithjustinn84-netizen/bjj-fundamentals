import { useCallback, useEffect, useState } from 'react';
import { reviews } from '../../data';
import { itemName, type Library } from '../../domain/library';
import type { StudyItem } from '../../domain/study';
import type { Grade } from '../../domain/types';

export type SessionStatus = 'idle' | 'active' | 'finished';

/**
 * State for one review session: the queue of cards, which side is showing, and grading.
 * Holds no rendering and no scheduling rules; those live in the page and in `domain/srs`.
 */
export function useReviewSession(lib: Library | undefined) {
  const [queue, setQueue] = useState<StudyItem[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const current = queue?.[0];
  const status: SessionStatus = queue === null ? 'idle' : current ? 'active' : 'finished';

  // If the current card's item was deleted mid-session (e.g. in another tab), drop it.
  const currentIsGone = !!lib && !!current && itemName(lib, current.kind, current.id) === null;
  useEffect(() => {
    if (currentIsGone && current) setQueue((q) => (q ? q.filter((item) => item !== current) : q));
  }, [currentIsGone, current]);

  const start = useCallback((items: StudyItem[]) => {
    setQueue(items);
    setDoneCount(0);
    setRevealed(false);
  }, []);

  const end = useCallback(() => setQueue(null), []);
  const reveal = useCallback(() => setRevealed(true), []);

  const grade = useCallback(
    async (value: Grade) => {
      if (!current || saving) return;
      setSaving(true);
      try {
        await reviews.recordReview(current, value);
        // "Again" sends the card to the back of this session's queue; anything else finishes it for now.
        setQueue((q) => {
          if (!q) return q;
          const rest = q.slice(1);
          return value === 'again' ? [...rest, current] : rest;
        });
        setDoneCount((n) => n + 1);
        setRevealed(false);
      } finally {
        setSaving(false);
      }
    },
    [current, saving],
  );

  return {
    status,
    current: currentIsGone ? undefined : current,
    remaining: queue?.length ?? 0,
    doneCount,
    revealed,
    saving,
    start,
    end,
    reveal,
    grade,
  };
}
