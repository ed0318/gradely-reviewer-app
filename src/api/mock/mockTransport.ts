import { createSeedState, type MockState } from './mockState';
import { handleMockRequest, type MockContext } from './mockServer';

/** Where the dummy server keeps its data between launches. Injected so tests keep it in memory. */
export type MockStore = { load: () => MockState | null; save: (state: MockState) => void };

/** How long a dummy answer takes, so loading states show as they will against the real server. */
const MOCK_LATENCY_MS = 350;

type MockSetup = { store: MockStore; createId: () => string };

let setup: MockSetup | null = null;
let context: MockContext | null = null;

/**
 * Where the dummy server keeps its data and how it makes ids: the phone's file
 * and expo-crypto in the app (setupMockServer.ts), memory in tests.
 */
export function configureMockServer(nextSetup: MockSetup): void {
  setup = nextSetup;
  context = null;
}

/** Forgets the in-memory server; the next request reloads from the store. */
export function resetMockServer(): void {
  context = null;
}

function getContext(): { context: MockContext; store: MockStore } {
  if (!setup) throw new Error('The mock API is on but not set up: import src/api/mock/setupMockServer first.');
  if (!context) context = { state: setup.store.load() ?? createSeedState(), createId: setup.createId, now: () => new Date() };
  return { context, store: setup.store };
}

/** A fetch that answers from the dummy server, with real `Response` objects. */
export async function fetchFromMock(path: string, init: RequestInit): Promise<Response> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, MOCK_LATENCY_MS);
    init.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

  const [pathname, queryString = ''] = path.split('?');
  const headers = (init.headers ?? {}) as Record<string, string>;
  const { context: serverContext, store } = getContext();
  const answer = handleMockRequest(serverContext, {
    method: (init.method ?? 'GET').toUpperCase(),
    path: pathname,
    query: new URLSearchParams(queryString),
    body: typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null,
    token: headers.Authorization?.replace(/^Bearer /, '') ?? null,
  });
  store.save(serverContext.state);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'Content-Type': 'application/json' } });
}
