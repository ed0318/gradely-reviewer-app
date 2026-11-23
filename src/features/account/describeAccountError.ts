import { ApiError, isOfflineError, isRequestCancelled } from '@/api/errors';

/**
 * What to tell the person when an account action fails. Switches on the
 * server's code, never its message; falls back to the server's message, which
 * reviewer-api writes for the student. Null for a cancelled request: say nothing.
 */
export function describeAccountError(error: unknown, offlineMessage = 'You appear to be offline. Connect and try again.'): string | null {
  if (isRequestCancelled(error)) return null;
  if (isOfflineError(error)) return offlineMessage;
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'That email or password is not right.';
      case 'email_taken':
        return 'An account already uses that email. Sign in instead.';
      case 'invalid_code':
        return 'That code is not right. Check the email and try again.';
      case 'code_expired':
        return 'That code has expired. Ask for a new one.';
      case 'too_many_requests':
        return 'Too many tries. Please wait a minute and try again.';
      case 'social_sign_in_failed':
        return 'That sign-in did not go through. Try again, or use your email.';
      case 'not_configured':
        return 'No account server is connected to this build.';
      case 'validation_failed':
        return firstFieldError(error) ?? error.message;
      default:
        return error.message;
    }
  }
  return 'Something went wrong. Please try again.';
}

function firstFieldError(error: ApiError): string | null {
  const messages = error.fieldErrors ? Object.values(error.fieldErrors)[0] : undefined;
  return messages?.[0] ?? null;
}
