import { API_URL, isApiConfigured, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, OfflineError, RequestCancelledError, SERVER_ERROR_MESSAGE, type ApiErrorCode, type FieldErrors } from './errors';
import { endSession } from './session';
import { readToken, saveToken } from './tokens';

/**
 * The one place the app talks to the reviewer API. Callers use `requestResult`
 * for an object and `requestList` for a list; the area files (auth, credits,
 * purchases, handover, appVersion) wrap these with typed functions.
 *
 * It attaches the bearer token, refreshes it once on a 401 (one refresh shared
 * by every request that hit the 401), and turns every failure into a typed
 * error: `OfflineError` when no answer came, `ApiError` with the server's code
 * when it refused, `RequestCancelledError` when the caller aborted.
 */

export type Pagination = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  /** Null on an empty page. */
  from: number | null;
  to: number | null;
};

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** No bearer token and no refresh: sign-in, register, password reset, products, app version. */
  isPublic?: boolean;
  /** The caller's abort, e.g. from a `useEffect` cleanup. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

type SuccessEnvelope = {
  success: true;
  message: string;
  result?: unknown;
  results?: unknown[];
  pagination?: { total: number; per_page: number; current_page: number; last_page: number; from: number | null; to: number | null };
};
type ErrorEnvelope = { success: false; code?: ApiErrorCode; message?: string; errors?: FieldErrors };

/** A single object: the envelope's `result`. An endpoint with nothing to return gives `{}`. */
export async function requestResult<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await sendWithRefresh(path, options);
  return (envelope.result ?? {}) as T;
}

/** A list: the envelope's `results`, and `pagination` when the endpoint pages. */
export async function requestList<T>(path: string, options: RequestOptions = {}): Promise<{ results: T[]; pagination: Pagination | null }> {
  const envelope = await sendWithRefresh(path, options);
  const pagination = envelope.pagination;
  return {
    results: (envelope.results ?? []) as T[],
    pagination: pagination
      ? {
          total: pagination.total,
          perPage: pagination.per_page,
          currentPage: pagination.current_page,
          lastPage: pagination.last_page,
          from: pagination.from,
          to: pagination.to,
        }
      : null,
  };
}

async function sendWithRefresh(path: string, options: RequestOptions): Promise<SuccessEnvelope> {
  if (!isApiConfigured) throw new ApiError(0, 'not_configured', 'No account server is connected yet.');

  const sentToken = options.isPublic ? null : await readToken();
  let response = await sendOnce(path, options, sentToken);

  if (response.status === 401 && !options.isPublic && sentToken) {
    // Another request may already have replaced the token while this one was out.
    const currentToken = await readToken();
    const outcome = currentToken !== null && currentToken !== sentToken ? 'renewed' : await refreshTokenOnce();
    if (outcome === 'unreachable') throw new OfflineError();
    if (outcome === 'renewed') response = await sendOnce(path, options, await readToken());
  }

  return readEnvelope(response, options);
}

async function sendOnce(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetchWithTimeout(`${API_URL}${path}${buildQueryString(options.query)}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }, options);
}

/**
 * fetch with the timeout and the caller's abort joined. A timeout or a dropped
 * connection is offline; the caller's own abort is a cancellation.
 */
async function fetchWithTimeout(url: string, init: RequestInit, options: Pick<RequestOptions, 'signal' | 'timeoutMs'>): Promise<Response> {
  if (options.signal?.aborted) throw new RequestCancelledError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener('abort', abortFromCaller);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    if (options.signal?.aborted) throw new RequestCancelledError();
    throw new OfflineError();
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

async function readEnvelope(response: Response, options: RequestOptions): Promise<SuccessEnvelope> {
  let envelope: SuccessEnvelope | ErrorEnvelope | null;
  try {
    envelope = (await response.json()) as SuccessEnvelope | ErrorEnvelope;
  } catch {
    // The body was cut off by the caller's abort, or the server sent no JSON at all.
    if (options.signal?.aborted) throw new RequestCancelledError();
    envelope = null;
  }

  if (response.ok && envelope?.success) return envelope;

  const failure = envelope && !envelope.success ? envelope : null;
  if (response.status === 401 && !options.isPublic) {
    // The refresh was refused or there was no token: the session is over.
    await endSession('refused');
  }
  throw new ApiError(
    response.status,
    failure?.code ?? (response.status === 401 ? 'unauthenticated' : 'server_error'),
    failure?.message ?? SERVER_ERROR_MESSAGE,
    failure?.errors ?? null,
  );
}

export function buildQueryString(query: RequestOptions['query']): string {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== null && entry[1] !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/** A new token, the server's refusal (the session is over), or no verdict at all (offline, 5xx). */
export type RefreshOutcome = 'renewed' | 'refused' | 'unreachable';

let refreshing: Promise<RefreshOutcome> | null = null;

/**
 * Trades the current token for a new one, once however many requests ask.
 * The endpoint is public on purpose: an expired token inside the refresh
 * window must reach it. Never throws.
 */
export function refreshTokenOnce(): Promise<RefreshOutcome> {
  if (!refreshing) {
    refreshing = requestNewToken().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function requestNewToken(): Promise<RefreshOutcome> {
  const token = await readToken();
  if (!token || !isApiConfigured) return 'refused';

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${API_URL}/auth/refresh`,
      { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
      {},
    );
  } catch {
    return 'unreachable';
  }

  // Only the server saying no ends a session; a 5xx is the server's trouble.
  if (response.status === 401 || response.status === 403) return 'refused';
  const envelope = (await response.json().catch(() => null)) as { success?: boolean; result?: { token?: string } } | null;
  const newToken = envelope?.success ? envelope.result?.token : undefined;
  if (!response.ok || !newToken) return 'unreachable';

  await saveToken(newToken);
  return 'renewed';
}
