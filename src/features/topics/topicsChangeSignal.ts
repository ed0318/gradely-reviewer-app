import { useSyncExternalStore } from 'react';

/**
 * "Topics or their questions changed somewhere else." A screen that lists them
 * re-reads when this ticks. Nothing carries the change itself: a save updates
 * its own screen in place, and this is only for a change a screen cannot see
 * (a topic made from Home, the dev seed, a blank question swept away).
 */
let version = 0;
const listeners = new Set<() => void>();

export function announceTopicsChanged(): void {
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTopicsChangeVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}
