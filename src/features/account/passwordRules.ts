/**
 * The rules reviewer-api enforces on a new password (`min:8|max:72` on
 * register and reset), checked as the person types so the button is never live
 * for a password the server will refuse.
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export type PasswordRule = { label: string; isMet: boolean };

export function listPasswordRules(password: string, confirmation?: string): PasswordRule[] {
  const rules: PasswordRule[] = [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, isMet: password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH },
  ];
  if (confirmation !== undefined) rules.push({ label: 'Both passwords match', isMet: password.length > 0 && password === confirmation });
  return rules;
}

export function meetsPasswordRules(password: string, confirmation?: string): boolean {
  return listPasswordRules(password, confirmation).every((rule) => rule.isMet);
}

/** Loose on purpose: the server decides; this only stops an obvious typo. */
export function looksLikeEmail(email: string): boolean {
  return /.+@.+\..+/.test(email.trim());
}
