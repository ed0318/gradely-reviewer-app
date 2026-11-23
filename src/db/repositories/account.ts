import type { SQLiteDatabase } from 'expo-sqlite';
import type { Profile, Settings } from '../records';
import { toSqlBoolean } from './sqlPlaceholders';

/** The signed-in account's copy on this phone (one row), and the app's settings (always one row). */

type ProfileRow = { account_id: string; email: string; first_name: string; last_name: string; photo_path: string | null };
type SettingsRow = {
  low_credit_alert_on: number;
  low_credit_threshold_units: number;
  low_credit_alerted: number;
  balance_units_cache: number | null;
  balance_checked_at: number | null;
};

export async function getProfile(database: SQLiteDatabase): Promise<Profile | null> {
  const row = await database.getFirstAsync<ProfileRow>('SELECT account_id, email, first_name, last_name, photo_path FROM profile WHERE id = 1');
  if (!row) return null;
  return { accountId: row.account_id, email: row.email, firstName: row.first_name, lastName: row.last_name, photoPath: row.photo_path };
}

/** Saves the profile, replacing the one before. */
export async function saveProfile(database: SQLiteDatabase, profile: Profile): Promise<void> {
  await database.runAsync(
    `INSERT INTO profile (id, account_id, email, first_name, last_name, photo_path) VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET account_id = excluded.account_id, email = excluded.email, first_name = excluded.first_name,
       last_name = excluded.last_name, photo_path = excluded.photo_path`,
    profile.accountId,
    profile.email,
    profile.firstName,
    profile.lastName,
    profile.photoPath,
  );
}

export async function deleteProfile(database: SQLiteDatabase): Promise<void> {
  await database.runAsync('DELETE FROM profile');
}

export async function getSettings(database: SQLiteDatabase): Promise<Settings> {
  const row = await database.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (!row) throw new Error('The settings row is missing; the schema seeds it.');
  return {
    lowCreditAlertOn: row.low_credit_alert_on === 1,
    lowCreditThresholdUnits: row.low_credit_threshold_units,
    lowCreditAlerted: row.low_credit_alerted === 1,
    balanceUnitsCache: row.balance_units_cache,
    balanceCheckedAt: row.balance_checked_at,
  };
}

export type LowCreditAlertSettings = Pick<Settings, 'lowCreditAlertOn' | 'lowCreditThresholdUnits'>;

/** Saves the alert switch and threshold, and re-arms the alert. */
export async function saveLowCreditAlertSettings(database: SQLiteDatabase, alert: LowCreditAlertSettings): Promise<void> {
  await database.runAsync(
    'UPDATE settings SET low_credit_alert_on = ?, low_credit_threshold_units = ?, low_credit_alerted = 0 WHERE id = 1',
    toSqlBoolean(alert.lowCreditAlertOn),
    alert.lowCreditThresholdUnits,
  );
}

export async function saveLowCreditAlerted(database: SQLiteDatabase, isAlerted: boolean): Promise<void> {
  await database.runAsync('UPDATE settings SET low_credit_alerted = ? WHERE id = 1', toSqlBoolean(isAlerted));
}

/** Keeps the last balance the server reported, for showing offline. */
export async function saveBalanceCache(database: SQLiteDatabase, balanceUnits: number, checkedAt: number): Promise<void> {
  if (!Number.isInteger(balanceUnits)) throw new RangeError(`Balances are whole units, got ${balanceUnits}.`);
  await database.runAsync('UPDATE settings SET balance_units_cache = ?, balance_checked_at = ? WHERE id = 1', balanceUnits, checkedAt);
}

export async function saveProfileName(database: SQLiteDatabase, firstName: string, lastName: string): Promise<void> {
  await database.runAsync('UPDATE profile SET first_name = ?, last_name = ? WHERE id = 1', firstName, lastName);
}

/** The photo's path relative to the app's document folder, or null to remove it. */
export async function saveProfilePhotoPath(database: SQLiteDatabase, photoPath: string | null): Promise<void> {
  await database.runAsync('UPDATE profile SET photo_path = ? WHERE id = 1', photoPath);
}
