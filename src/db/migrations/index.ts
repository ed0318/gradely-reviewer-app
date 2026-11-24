import { initialSchema } from './001_initialSchema';
import { chargingAttempts } from './002_chargingAttempts';
import { lowCreditAlertDefault } from './003_lowCreditAlertDefault';
import type { Migration } from './migration';

/** Every migration, oldest first. Add new ones at the end with the next version number; never edit a shipped one. */
export const MIGRATIONS: readonly Migration[] = [initialSchema, chargingAttempts, lowCreditAlertDefault];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
