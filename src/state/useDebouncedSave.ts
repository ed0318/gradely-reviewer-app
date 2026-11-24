import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMountedRef } from './useIsMountedRef';

export type SaveStatus = 'saved' | 'saving' | 'failed';

/**
 * Saves as you type: `schedule(value)` writes the newest value once typing
 * pauses for `delayMs`. Saves run one after another, never overlapping.
 * `flush()` writes now and resolves when everything scheduled has landed, and
 * leaving the screen flushes too, so nothing typed is lost. A failed save
 * reports `failed` and the next change tries again.
 */
export function useDebouncedSave<T>(save: (value: T) => Promise<unknown>, delayMs = 500) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const isMountedRef = useIsMountedRef();
  const saveRef = useRef(save);
  // Kept current after each render, so a save always runs the latest closure.
  useEffect(() => {
    saveRef.current = save;
  });
  const pendingRef = useRef<{ value: T } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef = useRef<Promise<void>>(Promise.resolve());

  const run = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const pending = pendingRef.current;
    if (!pending) return lastSaveRef.current;
    pendingRef.current = null;
    lastSaveRef.current = lastSaveRef.current
      .then(() => saveRef.current(pending.value))
      .then(() => {
        // Only "saved" once nothing newer is waiting behind this one.
        if (isMountedRef.current && !pendingRef.current) setStatus('saved');
      })
      .catch((error: unknown) => {
        console.warn('[reviewer] save failed', error);
        if (isMountedRef.current) setStatus('failed');
      });
    return lastSaveRef.current;
  }, [isMountedRef]);

  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = { value };
      setStatus('saving');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, delayMs);
    },
    [run, delayMs],
  );

  // Leaving the screen writes what is still waiting, and stops the timer.
  useEffect(() => () => void run(), [run]);

  return { status, schedule, flush: run };
}
