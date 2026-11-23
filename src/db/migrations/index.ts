import { initialSchema } from './001_initialSchema';
import type { Migration } from './migration';

/** Every migration, oldest first. Add new ones at the end with the next version number; never edit a shipped one. */
export const MIGRATIONS: readonly Migration[] = [initialSchema];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
