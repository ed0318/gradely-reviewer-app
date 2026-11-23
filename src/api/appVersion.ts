import { requestList } from './client';

export type AppPlatform = 'ios' | 'android';

export type AppVersion = { platform: AppPlatform; minSupportedVersion: string; latestVersion: string };

/** The oldest version still allowed and the newest available, per platform, for the required-update screen. */
export async function fetchAppVersions(signal?: AbortSignal): Promise<AppVersion[]> {
  const { results } = await requestList<{ platform: AppPlatform; min_supported_version: string; latest_version: string }>('/app/version', {
    isPublic: true,
    signal,
  });
  return results.map((version) => ({
    platform: version.platform,
    minSupportedVersion: version.min_supported_version,
    latestVersion: version.latest_version,
  }));
}
