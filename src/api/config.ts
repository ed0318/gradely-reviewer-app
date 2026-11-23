/**
 * Where the reviewer API lives. A base URL is not a secret; nothing secret
 * reaches this app. Unset, the app runs local-only and callers check
 * `isApiConfigured` before any request.
 */
const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

export const isApiConfigured = !!configuredUrl;

/** No trailing slash, so every path can start with one. */
export const API_URL = (configuredUrl ?? '').replace(/\/+$/, '');

/** Matches the server's own read timeout, as in gradely-app, so a slow server is not reported as offline. */
export const REQUEST_TIMEOUT_MS = 30_000;
