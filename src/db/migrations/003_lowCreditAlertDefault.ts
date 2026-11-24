import type { Migration } from './migration';

/**
 * The low-credit alert's starting threshold is 20 credits (80 units), as in the
 * mockup, not the 10 that migration 001 seeded.
 *
 * Only the untouched seed row is changed: still 40 units, alert on and never
 * rung, and no balance ever cached (the first sign-in caches one). A phone whose
 * owner has signed in, or has set their own number, keeps what it has.
 */
export const lowCreditAlertDefault: Migration = {
  version: 3,
  sql: `
UPDATE settings SET low_credit_threshold_units = 80
WHERE id = 1 AND low_credit_threshold_units = 40 AND low_credit_alert_on = 1 AND low_credit_alerted = 0
  AND balance_units_cache IS NULL AND balance_checked_at IS NULL;
`,
};
