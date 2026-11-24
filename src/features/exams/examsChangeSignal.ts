import { useSyncExternalStore } from 'react';

/**
 * "Exams or attempts changed somewhere else." Home and the lists re-read when
 * this ticks. Nothing carries the change itself: a screen that saves updates
 * itself in place, and this is for a change it cannot see (a charge settled in
 * the background, an exam deleted from Results).
 */
let version = 0;
const listeners = new Set<() => void>();

export function announceExamsChanged(): void {
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useExamsChangeVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}
