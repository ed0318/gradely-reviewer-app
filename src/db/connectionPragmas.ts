/**
 * Set on the one shared connection every time it opens.
 *
 * - `journal_mode = WAL`: reads never wait behind a write.
 * - `foreign_keys = ON`: SQLite leaves foreign keys off unless each connection
 *   turns them on, and the topic → question and exam → attempt cascades depend on it.
 * - `synchronous = NORMAL`: safe in WAL mode; a power cut can lose the last
 *   commit or two, never corrupt the file.
 *
 * Kept apart from `client.ts` so tests open better-sqlite3 the same way.
 */
export const CONNECTION_PRAGMAS = 'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;';
