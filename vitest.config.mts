import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Tests run in Node against real SQLite (better-sqlite3), so the schema and the
 * repositories are checked with the same SQL the phone runs.
 */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
