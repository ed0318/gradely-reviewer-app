/**
 * Dev-only: when the bundle started running, for the `[boot]` line (see
 * `perfLog.tsx`). Imported first in index.js and imports nothing itself, so the
 * time is taken before any other module is evaluated — tablet sizing included,
 * which must still run before anything creates a stylesheet.
 */

export const perfNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const bundleStart = perfNow();
