import React, { Profiler, useCallback, useRef, type ProfilerOnRenderCallback } from 'react';
import { useRoute } from 'expo-router';
import { bundleStart, perfNow as now } from './bootClock';

/**
 * Dev-only performance lines for the Metro terminal, read alongside `[query]`,
 * `[sql:*]` and `[screen:*]`:
 *
 *  - `[boot]`: one line per cold start, with the ms since the bundle started at
 *    each step on the way to the first screen;
 *  - `[render]`: which screens committed in a burst of renders, how many times
 *    and for how long — one line per interaction, not one per commit;
 *  - `[api]`: one line per request to the account server.
 *
 * Counts are what a dev build is good for. Its milliseconds are several times a
 * release build's, so they say where time goes, not how long a teacher waits.
 * Every entry point returns at once outside `__DEV__`.
 */

/* Boot ------------------------------------------------------------------- */

const bootSteps: Array<{ step: string; at: number; note?: string }> = [];
let bootPrinted = false;

/** Steps that end the boot line: the first screen a teacher can use. */
const FINAL_STEPS = new Set(['today usable', 'first screen (not Today)']);

/** A launch that never reaches either final step still prints what it got. */
const BOOT_GIVE_UP_MS = 20_000;
if (__DEV__) setTimeout(() => printBoot('gave up waiting'), Math.max(0, BOOT_GIVE_UP_MS - (now() - bundleStart)));

function printBoot(reason?: string) {
  if (bootPrinted) return;
  bootPrinted = true;
  const parts = bootSteps.map((s) => `${s.step} ${Math.round(s.at)}${s.note ? ` (${s.note})` : ''}`);
  const total = bootSteps.length ? Math.round(bootSteps[bootSteps.length - 1].at) : 0;
  console.log(`[boot] ${total}ms · ${parts.join(' · ')}${reason ? ` · ${reason}` : ''}`);
  printEvaluated();
}

/** Modules worth knowing about if they run before the first screen: big, and not needed by it. */
const WATCHED = [
  'xlsx',
  'jsqrSource',
  'psgc-places',
  '@noble',
  'src/data/mock',
  'purchases-js-hybrid-mappings',
  'src/data/examImport',
  'src/gradeView/server',
  'src/reports',
  'src/backup',
];

/**
 * What the bundle had evaluated by the time the boot line printed, from
 * Metro's own module table (dev only: `__r.getModules`). Which modules ran
 * before the first screen is what lazy `require`s could trim.
 */
function printEvaluated() {
  const getModules = (globalThis as { __r?: { getModules?: () => Map<number, { isInitialized?: boolean; verboseName?: string }> } }).__r?.getModules;
  if (!getModules) return;
  let all = 0;
  const done: string[] = [];
  for (const mod of getModules().values()) {
    all += 1;
    if (mod.isInitialized) done.push(mod.verboseName ?? '?');
  }
  const byPackage = new Map<string, number>();
  for (const name of done) {
    const pkg = name.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1] ?? name.split('/').slice(0, 2).join('/');
    byPackage.set(pkg, (byPackage.get(pkg) ?? 0) + 1);
  }
  const top = [...byPackage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const watched = WATCHED.map((w) => `${w} ${done.some((n) => n.includes(w)) ? 'yes' : 'no'}`);
  console.log(`[boot] evaluated ${done.length} of ${all} modules · watched: ${watched.join(', ')}`);
  console.log(`[boot] evaluated by package: ${top.map(([p, n]) => `${p} ${n}`).join(' · ')}`);
}

/**
 * Records one step of the cold start, once: the first time a step is reached
 * is the one that counts, and nothing is recorded after the line has printed.
 */
export function bootMark(step: string, note?: string) {
  if (!__DEV__ || bootPrinted || bootSteps.some((s) => s.step === step)) return;
  bootSteps.push({ step, at: now() - bundleStart, note });
  if (FINAL_STEPS.has(step)) printBoot();
}

/* Render ----------------------------------------------------------------- */

type Tally = { commits: number; mounts: number; ms: number };
const burst = new Map<string, Tally>();
let burstStart = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** A burst ends after this long with no commit. Long enough to hold a tap's re-read and its render together. */
const QUIET_MS = 400;

function flushRenders() {
  flushTimer = null;
  if (!burst.size) return;
  const rows = [...burst.entries()].sort((a, b) => b[1].ms - a[1].ms);
  const total = rows.reduce((sum, [, t]) => sum + t.ms, 0);
  const commits = rows.reduce((sum, [, t]) => sum + t.commits, 0);
  const span = Math.round(now() - QUIET_MS - burstStart);
  const parts = rows.map(([name, t]) => `${name} ×${t.commits}${t.mounts ? ` (${t.mounts} mount)` : ''} ${t.ms.toFixed(1)}ms`);
  console.log(`[render] ${commits} commits · ${total.toFixed(1)}ms over ${span}ms · ${parts.join(' · ')}`);
  burst.clear();
}

function recordCommit(id: string, first: boolean, actualDuration: number) {
  if (!burst.size) burstStart = now();
  const tally = burst.get(id) ?? { commits: 0, mounts: 0, ms: 0 };
  tally.commits += 1;
  if (first) tally.mounts += 1;
  tally.ms += actualDuration;
  burst.set(id, tally);
  if (first) bootMark(id === 'index' ? 'first screen' : 'first screen (not Today)', id);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushRenders, QUIET_MS);
}

/**
 * Wraps a screen's tree in a React Profiler named after its route.
 *
 * `useRoute` reads the screen's own route, which changes only when that
 * screen's params do — so this adds no render of its own on navigation, and
 * whatever the line counts is the screen's doing. Rendered by `Screen` in dev
 * builds only.
 */
export function RenderProbe({ children }: { children: React.ReactNode }) {
  const route = useRoute();
  // A pushed screen's first commit does not always arrive as phase 'mount' — the
  // native stack can render it before it is shown — so a mount is this probe's
  // first commit, whatever React calls it.
  const seen = useRef(false);
  const onRender = useCallback<ProfilerOnRenderCallback>((id, _phase, actualDuration) => {
    const first = !seen.current;
    seen.current = true;
    recordCommit(id, first, actualDuration);
  }, []);
  return (
    <Profiler id={route.name} onRender={onRender}>
      {children}
    </Profiler>
  );
}

/* Stalls ----------------------------------------------------------------- */

/**
 * How long the JS thread went without a turn while some work ran: a 16 ms
 * timer that notes the longest gap between its ticks. A gap is time in which no
 * tap was handled and nothing JS-driven was drawn. Returns `stop`, which
 * reports. A no-op outside `__DEV__`.
 */
export function watchStalls(): () => { longestMs: number; over100: number } {
  if (!__DEV__) return () => ({ longestMs: 0, over100: 0 });
  let last = now();
  let longestMs = 0;
  let over100 = 0;
  const timer = setInterval(() => {
    const t = now();
    const gap = t - last;
    last = t;
    if (gap > longestMs) longestMs = gap;
    if (gap > 100) over100 += 1;
  }, 16);
  return () => {
    clearInterval(timer);
    // The gap still open when the work ends counts too.
    const gap = now() - last;
    if (gap > longestMs) longestMs = gap;
    if (gap > 100) over100 += 1;
    return { longestMs: Math.round(longestMs), over100 };
  };
}

/* API -------------------------------------------------------------------- */

function byteLength(text: string): number {
  try {
    return new TextEncoder().encode(text).length;
  } catch {
    return text.length;
  }
}

/**
 * One request to the account server: `[api] GET /auth/me 200 84ms 1.2KB`.
 * `note` says when it was the retry after a refresh, or the refresh itself.
 * Reads a clone of the body, so the caller's own read is untouched.
 */
export function apiLog(method: string, path: string, startedAt: number, response: Response | null, note?: string) {
  if (!__DEV__) return;
  const tail = note ? ` · ${note}` : '';
  if (!response) {
    console.log(`[api] ${method} ${path} FAILED ${Math.round(now() - startedAt)}ms (no response)${tail}`);
    return;
  }
  // Headers have arrived; the ms printed runs on to the end of the body.
  const headersMs = Math.round(now() - startedAt);
  response
    .clone()
    .text()
    .then(
      (body) => {
        const bytes = byteLength(body);
        const size = bytes >= 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`;
        console.log(`[api] ${method} ${path} ${response.status} ${Math.round(now() - startedAt)}ms ${size} · headers at ${headersMs}ms${tail}`);
      },
      () => console.log(`[api] ${method} ${path} ${response.status} ${headersMs}ms (body unreadable)${tail}`),
    );
}

/** The clock `apiLog` measures against. */
export { now as perfNow };
