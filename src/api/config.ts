/**
 * Where the reviewer API lives. A base URL is not a secret; nothing secret
 * reaches this app. Unset, the app runs local-only and callers check
 * `isApiConfigured` before any request.
 */
const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

/**
 * EXPO_PUBLIC_API_MOCK=1 answers every request from the dummy server in
 * src/api/mock instead of the network: same paths, envelopes and error codes as
 * reviewer-api, so nothing above src/api changes when it is turned off.
 * Development only: it needs `__DEV__`, so a release bundle never answers from the dummy
 * server even if the variable leaks in, and app.config.js refuses it for store and preview builds too.
 */
export const isApiMocked = typeof __DEV__ !== 'undefined' && __DEV__ && process.env.EXPO_PUBLIC_API_MOCK === '1';

export const isApiConfigured = isApiMocked || !!configuredUrl;

/** No trailing slash, so every path can start with one. */
export const API_URL = (configuredUrl ?? '').replace(/\/+$/, '');

/** Matches the server's own read timeout, as in gradely-app, so a slow server is not reported as offline. */
export const REQUEST_TIMEOUT_MS = 30_000;
