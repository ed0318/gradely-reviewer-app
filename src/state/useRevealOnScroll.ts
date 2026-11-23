import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** How close to the bottom counts as "nearly there", in points. */
const RUNWAY = 400;

/**
 * Whether a scroll event should reveal another chunk.
 *
 * Near the end is not enough on its own. The scroll view keeps sending events
 * (~15 a second, `scrollEventThrottle={64}`) while the teacher is down there,
 * and each reveal used to re-render the whole screen even once every row was
 * already showing — a 50-question exam re-rendered ~15 times a second for as
 * long as it was scrolled near the bottom. So a reveal waits until the content
 * has grown since the last one: the rows it asked for were drawn, or the page
 * it asked for arrived. When the list has run out, the content stops growing
 * and so do the reveals. `grownFrom` is the content height at the last reveal,
 * or null when there has not been one since the list started.
 */
export function shouldReveal(event: NativeScrollEvent, grownFrom: number | null): boolean {
  const { contentOffset, contentSize, layoutMeasurement } = event;
  const distanceToEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
  if (distanceToEnd > RUNWAY) return false;
  return grownFrom === null || contentSize.height !== grownFrom;
}

/**
 * Infinite scroll for a list that cannot be virtualized.
 *
 * A recycling list inside a scroll view does not recycle: it is handed
 * unbounded height, decides everything is visible, and renders the lot. So on
 * a screen that scrolls as a whole — the class page, where the roster sits
 * under a header, some stats and a tab bar — the list cannot own its own
 * scrolling, and the screen's scroll view has to drive it instead.
 *
 * What this gives up is recycling: revealed rows stay mounted. That is the
 * right trade here only because the ceiling is low — a roster is bounded by how
 * many people are in one class, not by how many the account has. The students
 * list, which is the whole account, uses a real recycling list for exactly that
 * reason.
 */
export function useRevealOnScroll(chunk: number, resetKey?: unknown) {
  const [shown, setShown] = useState(chunk);
  const grownFrom = useRef<number | null>(null);

  // A different list starts from the top again — page four of the old one means
  // nothing in the new one. Its content can be the same height as the old one's
  // (a re-sort), so the last reveal's height is forgotten too.
  useEffect(() => {
    grownFrom.current = null;
    setShown(chunk);
  }, [resetKey, chunk]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!shouldReveal(e.nativeEvent, grownFrom.current)) return;
      grownFrom.current = e.nativeEvent.contentSize.height;
      // Bounded by the caller slicing against its own list, so growing past the
      // end costs nothing and saves having to pass the length in here. Callers
      // that page from the database read the next page when this passes their
      // rows, which is why it may grow one chunk past them.
      setShown((n) => n + chunk);
    },
    [chunk],
  );

  const reset = useCallback(() => {
    grownFrom.current = null;
    setShown(chunk);
  }, [chunk]);

  return { shown, onScroll, reset };
}
