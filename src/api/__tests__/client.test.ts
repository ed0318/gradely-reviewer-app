import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The client against a mocked fetch: unwrapping, the one shared token refresh,
 * and every failure turned into the right typed error.
 */

const secureStore = new Map<string, string>();
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => secureStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    secureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    secureStore.delete(key);
  },
}));

const BASE_URL = 'http://api.test/v1';
const TOKEN_KEY = 'reviewer.token';

type FetchCall = { path: string; method: string; authorization: string | null; body: unknown };
let fetchCalls: FetchCall[] = [];

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Installs a fetch that records each call and answers with `answer`. */
function mockFetch(answer: (call: FetchCall, init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      const call = {
        path: url.replace(BASE_URL, ''),
        method: init.method ?? 'GET',
        authorization: headers.Authorization ?? null,
        body: init.body ? JSON.parse(init.body as string) : undefined,
      };
      fetchCalls.push(call);
      return answer(call, init);
    }),
  );
}

/** Fresh modules so the config reads the stubbed env and no token or refresh is held over. */
async function loadApi() {
  const client = await import('../client');
  const errors = await import('../errors');
  const session = await import('../session');
  return { ...client, ...errors, ...session };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_API_URL', `${BASE_URL}/`);
  secureStore.clear();
  secureStore.set(TOKEN_KEY, 'old-token');
  fetchCalls = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('requests', () => {
  it('sends the token and JSON body, and unwraps result', async () => {
    mockFetch(() => jsonResponse(200, { success: true, message: 'OK.', result: { balance_units: 30 } }));
    const { requestResult } = await loadApi();

    await expect(requestResult('/exams/charge', { method: 'POST', body: { item_count: 30 } })).resolves.toEqual({ balance_units: 30 });
    expect(fetchCalls).toEqual([{ path: '/exams/charge', method: 'POST', authorization: 'Bearer old-token', body: { item_count: 30 } }]);
  });

  it('builds the query string and reads a paged list', async () => {
    mockFetch(() =>
      jsonResponse(200, {
        success: true,
        message: 'OK.',
        results: [{ id: 1 }],
        pagination: { total: 11, per_page: 10, current_page: 2, last_page: 2, from: 11, to: 11 },
      }),
    );
    const { requestList } = await loadApi();

    const page = await requestList('/credits/transactions', { query: { page: 2, search: 'bio quiz', empty: '', missing: undefined } });
    expect(fetchCalls[0].path).toBe('/credits/transactions?page=2&search=bio%20quiz');
    expect(page).toEqual({
      results: [{ id: 1 }],
      pagination: { total: 11, perPage: 10, currentPage: 2, lastPage: 2, from: 11, to: 11 },
    });
  });

  it('sends no token on a public request', async () => {
    mockFetch(() => jsonResponse(200, { success: true, message: 'OK.', results: [] }));
    const { requestList } = await loadApi();
    await requestList('/products', { isPublic: true });
    expect(fetchCalls[0].authorization).toBeNull();
  });

  it('gives {} for an endpoint with nothing to return', async () => {
    mockFetch(() => jsonResponse(200, { success: true, message: 'Signed out.' }));
    const { requestResult } = await loadApi();
    await expect(requestResult('/auth/logout', { method: 'POST' })).resolves.toEqual({});
  });

  it('refuses to send when no server is configured', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_URL', '');
    mockFetch(() => jsonResponse(200, {}));
    const { requestResult, ApiError } = await loadApi();
    const failure = requestResult('/me');
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ code: 'not_configured' });
    expect(fetchCalls).toEqual([]);
  });
});

describe('token refresh', () => {
  it('refreshes once for several requests that hit a 401, then retries each with the new token', async () => {
    mockFetch(async (call) => {
      // Let every request get out before any answer comes back.
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (call.path === '/auth/refresh') return jsonResponse(200, { success: true, message: 'OK.', result: { token: 'new-token' } });
      if (call.authorization !== 'Bearer new-token') return jsonResponse(401, { success: false, code: 'unauthenticated', message: 'Sign in again.' });
      return jsonResponse(200, { success: true, message: 'OK.', result: { path: call.path } });
    });
    const { requestResult } = await loadApi();

    const answers = await Promise.all([requestResult('/me'), requestResult('/credits/transactions'), requestResult('/me')]);
    expect(answers).toEqual([{ path: '/me' }, { path: '/credits/transactions' }, { path: '/me' }]);
    const refreshCalls = fetchCalls.filter((call) => call.path === '/auth/refresh');
    expect(refreshCalls).toEqual([{ path: '/auth/refresh', method: 'POST', authorization: 'Bearer old-token', body: undefined }]);
    expect(secureStore.get(TOKEN_KEY)).toBe('new-token');
  });

  it('ends the session when the refresh is refused', async () => {
    mockFetch((call) =>
      call.path === '/auth/refresh'
        ? jsonResponse(401, { success: false, code: 'unauthenticated', message: 'Sign in again.' })
        : jsonResponse(401, { success: false, code: 'unauthenticated', message: 'Sign in again.' }),
    );
    const { requestResult, subscribeToSessionEnd } = await loadApi();
    const sessionEnds: string[] = [];
    const unsubscribe = subscribeToSessionEnd((reason) => sessionEnds.push(reason));

    await expect(requestResult('/me')).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
    expect(sessionEnds).toEqual(['refused']);
    expect(secureStore.has(TOKEN_KEY)).toBe(false);
    // The refused refresh was not followed by a second try of /me.
    expect(fetchCalls.map((call) => call.path)).toEqual(['/me', '/auth/refresh']);
    unsubscribe();
  });

  it('keeps the session when the refresh cannot reach the server', async () => {
    mockFetch((call) => {
      if (call.path === '/auth/refresh') throw new TypeError('Network request failed');
      return jsonResponse(401, { success: false, code: 'unauthenticated', message: 'Sign in again.' });
    });
    const { requestResult, OfflineError, subscribeToSessionEnd } = await loadApi();
    const sessionEnds: string[] = [];
    subscribeToSessionEnd((reason) => sessionEnds.push(reason));

    await expect(requestResult('/me')).rejects.toBeInstanceOf(OfflineError);
    expect(sessionEnds).toEqual([]);
    expect(secureStore.get(TOKEN_KEY)).toBe('old-token');
  });

  it('treats a 5xx from the refresh as no verdict, not a sign-out', async () => {
    mockFetch((call) =>
      call.path === '/auth/refresh'
        ? jsonResponse(503, { success: false, code: 'service_unavailable', message: 'Down.' })
        : jsonResponse(401, { success: false, code: 'unauthenticated', message: 'Sign in again.' }),
    );
    const { requestResult, OfflineError } = await loadApi();
    await expect(requestResult('/me')).rejects.toBeInstanceOf(OfflineError);
    expect(secureStore.get(TOKEN_KEY)).toBe('old-token');
  });

  it('does not refresh on a public 401, such as a wrong password', async () => {
    mockFetch(() => jsonResponse(401, { success: false, code: 'invalid_credentials', message: 'Wrong email or password.' }));
    const { requestResult, subscribeToSessionEnd } = await loadApi();
    const sessionEnds: string[] = [];
    subscribeToSessionEnd((reason) => sessionEnds.push(reason));

    await expect(requestResult('/auth/login', { method: 'POST', body: {}, isPublic: true })).rejects.toMatchObject({ code: 'invalid_credentials' });
    expect(fetchCalls.map((call) => call.path)).toEqual(['/auth/login']);
    expect(sessionEnds).toEqual([]);
  });
});

describe('errors', () => {
  it('carries the server code, status and field errors', async () => {
    mockFetch(() =>
      jsonResponse(422, {
        success: false,
        code: 'validation_failed',
        message: 'The email field is required.',
        errors: { email: ['The email field is required.'] },
      }),
    );
    const { requestResult, ApiError } = await loadApi();
    const failure = await requestResult('/auth/register', { method: 'POST', body: {}, isPublic: true }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({
      status: 422,
      code: 'validation_failed',
      message: 'The email field is required.',
      fieldErrors: { email: ['The email field is required.'] },
    });
  });

  it('reports a short balance as insufficient_credits', async () => {
    mockFetch(() => jsonResponse(402, { success: false, code: 'insufficient_credits', message: 'Not enough credits.' }));
    const { requestResult, hasApiErrorCode } = await loadApi();
    const failure = await requestResult('/exams/charge', { method: 'POST', body: {} }).catch((error: unknown) => error);
    expect(hasApiErrorCode(failure, 'insufficient_credits')).toBe(true);
  });

  it('turns a body that is not JSON into a server_error', async () => {
    mockFetch(() => new Response('<html>502 Bad Gateway</html>', { status: 502 }));
    const { requestResult } = await loadApi();
    await expect(requestResult('/me')).rejects.toMatchObject({ status: 502, code: 'server_error' });
  });

  it('turns a failed fetch into OfflineError', async () => {
    mockFetch(() => {
      throw new TypeError('Network request failed');
    });
    const { requestResult, OfflineError } = await loadApi();
    await expect(requestResult('/me')).rejects.toBeInstanceOf(OfflineError);
  });

  it('turns a timeout into OfflineError', async () => {
    mockFetch(
      (_call, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const { requestResult, OfflineError } = await loadApi();
    await expect(requestResult('/me', { timeoutMs: 10 })).rejects.toBeInstanceOf(OfflineError);
  });

  it("turns the caller's abort into RequestCancelledError, not offline", async () => {
    mockFetch(
      (_call, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const { requestResult, RequestCancelledError, isRequestCancelled } = await loadApi();
    const controller = new AbortController();
    const pending = requestResult('/me', { signal: controller.signal }).catch((error: unknown) => error);
    controller.abort();
    const failure = await pending;
    expect(failure).toBeInstanceOf(RequestCancelledError);
    expect(isRequestCancelled(failure)).toBe(true);

    // Already aborted: nothing is sent.
    fetchCalls = [];
    await expect(requestResult('/me', { signal: controller.signal })).rejects.toBeInstanceOf(RequestCancelledError);
    expect(fetchCalls).toEqual([]);
  });
});
