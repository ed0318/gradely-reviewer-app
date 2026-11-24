import { useSyncExternalStore } from 'react';
import { isApiMocked } from '../config';

/**
 * DEV ONLY: a switch that makes the dummy server act as if the phone had no
 * internet, so the offline paths (the offline sheet, a charge that stays
 * `charging`, the retry with the same key) can be tried without airplane mode.
 *
 * It can only be on when the dummy API is on (EXPO_PUBLIC_API_MOCK=1) in a
 * development build (`__DEV__`); a release build refuses the mock altogether
 * (app.config.js), so none of this reaches one. It starts on when
 * EXPO_PUBLIC_API_MOCK_OFFLINE=1, and Settings shows a switch for it while
 * the dummy API is on.
 */
export const isMockOfflineAvailable = isApiMocked && typeof __DEV__ !== 'undefined' && __DEV__;

let isOffline = isMockOfflineAvailable && process.env.EXPO_PUBLIC_API_MOCK_OFFLINE === '1';
const listeners = new Set<() => void>();

export function isMockNetworkOffline(): boolean {
  return isOffline;
}

export function setMockNetworkOffline(next: boolean): void {
  if (!isMockOfflineAvailable) return;
  isOffline = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMockNetworkOffline(): boolean {
  return useSyncExternalStore(subscribe, isMockNetworkOffline);
}
