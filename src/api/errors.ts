/**
 * The error codes the server sends (`App\Enums\ApiErrorCode` in reviewer-api).
 * A public contract: the app switches on these, never on the message.
 * `not_configured` is the app's own, for a build with no API address.
 */
export type ApiErrorCode =
  | 'validation_failed'
  | 'unauthenticated'
  | 'invalid_credentials'
  | 'forbidden'
  | 'not_found'
  | 'method_not_allowed'
  | 'email_taken'
  | 'insufficient_credits'
  | 'idempotency_key_reused'
  | 'invalid_code'
  | 'code_expired'
  | 'social_sign_in_failed'
  | 'too_many_requests'
  | 'store_unavailable'
  | 'service_unavailable'
  | 'server_error'
  | 'not_configured';

export const OFFLINE_MESSAGE = 'You appear to be offline. Check your connection and try again.';
export const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.';

/** Field name → messages, present only on `validation_failed`. */
export type FieldErrors = Record<string, string[]>;

/** The server answered and refused the request. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors: FieldErrors | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The request never reached the server, or no answer came back in time. */
export class OfflineError extends Error {
  constructor() {
    super(OFFLINE_MESSAGE);
    this.name = 'OfflineError';
  }
}

/** The caller aborted the request (the screen unmounted). Not a failure to show anyone. */
export class RequestCancelledError extends Error {
  constructor() {
    super('The request was cancelled.');
    this.name = 'RequestCancelledError';
  }
}

export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError;
}

export function isRequestCancelled(error: unknown): error is RequestCancelledError {
  return error instanceof RequestCancelledError;
}

export function hasApiErrorCode(error: unknown, code: ApiErrorCode): error is ApiError {
  return error instanceof ApiError && error.code === code;
}

/**
 * The store (Google Play, the App Store, or the dev dummy store) could not
 * take or start a purchase. The message is safe to show.
 */
export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}
