/** One numbered schema step. `version` becomes `PRAGMA user_version` once its SQL has run. */
export type Migration = { version: number; sql: string };
