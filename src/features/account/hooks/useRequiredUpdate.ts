import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fetchAppVersions } from '@/api/appVersion';
import { isApiConfigured } from '@/api/config';
import { isBelowMinimumVersion } from '@/lib/appVersionCompare';

export type RequiredUpdateState = { kind: 'checking' } | { kind: 'current' } | { kind: 'required'; minimumVersion: string };

/** How long the splash waits on the version check before letting the app open anyway. */
const VERSION_CHECK_TIMEOUT_MS = 5_000;

export const INSTALLED_APP_VERSION = Constants.expoConfig?.version ?? '0';

/**
 * Asks the server for the oldest version still allowed, once per launch.
 * Offline, slow or failing, the app opens: only a clear "too old" blocks it.
 */
export function useRequiredUpdate(): RequiredUpdateState {
  const [state, setState] = useState<RequiredUpdateState>(() => (isApiConfigured ? { kind: 'checking' } : { kind: 'current' }));

  useEffect(() => {
    if (!isApiConfigured) return;
    let isMounted = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERSION_CHECK_TIMEOUT_MS);
    fetchAppVersions(controller.signal)
      .then((versions) => {
        const platformVersion = versions.find((version) => version.platform === Platform.OS);
        const isTooOld = !!platformVersion && isBelowMinimumVersion(INSTALLED_APP_VERSION, platformVersion.minSupportedVersion);
        if (isMounted) setState(isTooOld ? { kind: 'required', minimumVersion: platformVersion.minSupportedVersion } : { kind: 'current' });
      })
      .catch(() => {
        // Offline, timed out or refused: open the app.
        if (isMounted) setState({ kind: 'current' });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      isMounted = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return state;
}
