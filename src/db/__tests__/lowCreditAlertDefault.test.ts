import { describe, expect, it } from 'vitest';
import { MIGRATIONS } from '../migrations';
import { runMigrations } from '../runMigrations';
import { getSettings } from '../repositories/account';
import { openMemoryDatabase, openMigratedMemoryDatabase } from '../testing/memoryDatabase';

describe('migration 003 (low-credit alert default)', () => {
  it('starts a new install at 20 credits', async () => {
    const database = await openMigratedMemoryDatabase();
    expect(await getSettings(database)).toMatchObject({ lowCreditThresholdUnits: 80 });
  });

  it('moves a phone still on the untouched seed', async () => {
    const database = openMemoryDatabase();
    await runMigrations(database, MIGRATIONS.slice(0, 2));
    expect(await getSettings(database)).toMatchObject({ lowCreditThresholdUnits: 40 });
    await runMigrations(database);
    expect(await getSettings(database)).toMatchObject({ lowCreditThresholdUnits: 80 });
  });

  it('leaves a phone that has signed in (a balance was cached) as it is', async () => {
    const database = openMemoryDatabase();
    await runMigrations(database, MIGRATIONS.slice(0, 2));
    await database.runAsync('UPDATE settings SET balance_units_cache = 100, balance_checked_at = 1 WHERE id = 1');
    await runMigrations(database);
    expect(await getSettings(database)).toMatchObject({ lowCreditThresholdUnits: 40, balanceUnitsCache: 100 });
  });
});
