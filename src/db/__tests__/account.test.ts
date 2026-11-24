import { describe, expect, it } from 'vitest';
import {
  deleteProfile,
  getProfile,
  getSettings,
  saveBalanceCache,
  saveLowCreditAlerted,
  saveLowCreditAlertSettings,
  saveProfile,
} from '../repositories/account';
import { openMigratedMemoryDatabase } from '../testing/memoryDatabase';

const PROFILE = { accountId: 'account-1', email: 'student@example.com', firstName: 'Ana', lastName: 'Cruz', photoPath: null };

describe('profile', () => {
  it('keeps one profile, replaced on save and cleared on sign-out', async () => {
    const database = await openMigratedMemoryDatabase();
    expect(await getProfile(database)).toBeNull();

    await saveProfile(database, PROFILE);
    await saveProfile(database, { ...PROFILE, photoPath: 'file:///profile.jpg' });
    expect(await getProfile(database)).toEqual({ ...PROFILE, photoPath: 'file:///profile.jpg' });

    await deleteProfile(database);
    expect(await getProfile(database)).toBeNull();
  });
});

describe('settings', () => {
  it('starts with the low-credit alert on at 20 credits', async () => {
    const database = await openMigratedMemoryDatabase();
    expect(await getSettings(database)).toEqual({
      lowCreditAlertOn: true,
      lowCreditThresholdUnits: 80,
      lowCreditAlerted: false,
      balanceUnitsCache: null,
      balanceCheckedAt: null,
    });
  });

  it('re-arms the alert when its threshold changes', async () => {
    const database = await openMigratedMemoryDatabase();
    await saveLowCreditAlerted(database, true);
    await saveLowCreditAlertSettings(database, { lowCreditAlertOn: true, lowCreditThresholdUnits: 80 });
    expect(await getSettings(database)).toMatchObject({ lowCreditThresholdUnits: 80, lowCreditAlerted: false });
  });

  it('caches the balance in whole units only', async () => {
    const database = await openMigratedMemoryDatabase();
    await saveBalanceCache(database, 600, 7_000);
    expect(await getSettings(database)).toMatchObject({ balanceUnitsCache: 600, balanceCheckedAt: 7_000 });
    await expect(saveBalanceCache(database, 7.5, 8_000)).rejects.toThrow(RangeError);
  });
});
