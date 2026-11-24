import { describe, expect, it } from 'vitest';
import { getProfile, getSettings, saveBalanceCache, saveProfile, saveProfileName, saveProfilePhotoPath } from '../repositories/account';
import { insertExamWithFirstAttempt } from '../repositories/exams';
import { BACKUP_TABLES, eraseAllLocalData, hasLocalData, readAllLocalTables, summarizeLocalData } from '../repositories/localData';
import { insertQuestion } from '../repositories/questions';
import { insertTopic } from '../repositories/topics';
import { buildAttempt, buildAttemptQuestions, buildExam, buildOneOfEachType, buildTopic } from '../testing/fixtures';
import { openMigratedMemoryDatabase } from '../testing/memoryDatabase';

const PROFILE = { accountId: 'owner-1', email: 'owner@example.com', firstName: 'Ana', lastName: 'Reyes', photoPath: null };

async function openWithData() {
  const database = await openMigratedMemoryDatabase();
  await saveProfile(database, PROFILE);
  await insertTopic(database, buildTopic());
  for (const question of buildOneOfEachType()) await insertQuestion(database, question, 1_000);
  await insertExamWithFirstAttempt(database, buildExam(), buildAttempt(), buildAttemptQuestions());
  await saveBalanceCache(database, 600, 5_000);
  return database;
}

describe('local data', () => {
  it('counts topics, questions and exams', async () => {
    const database = await openWithData();
    const summary = await summarizeLocalData(database);
    expect(summary).toEqual({ topicCount: 1, questionCount: 4, examCount: 1 });
    expect(hasLocalData(summary)).toBe(true);
    expect(hasLocalData(await summarizeLocalData(await openMigratedMemoryDatabase()))).toBe(false);
  });

  it('reads every backed-up table whole', async () => {
    const database = await openWithData();
    const tables = await readAllLocalTables(database);
    expect(Object.keys(tables)).toEqual([...BACKUP_TABLES]);
    expect(tables.topic_questions).toHaveLength(4);
    expect(tables.attempt_questions).toHaveLength(2);
  });

  it('erases everything and resets the settings', async () => {
    const database = await openWithData();
    await eraseAllLocalData(database);
    expect(await summarizeLocalData(database)).toEqual({ topicCount: 0, questionCount: 0, examCount: 0 });
    for (const [table, rows] of Object.entries(await readAllLocalTables(database))) expect(rows, table).toEqual([]);
    expect(await getProfile(database)).toBeNull();
    expect(await getSettings(database)).toMatchObject({ balanceUnitsCache: null, lowCreditThresholdUnits: 80 });
  });

  it('saves the name and photo path on the profile', async () => {
    const database = await openWithData();
    await saveProfileName(database, 'Anna', 'Reyes-Cruz');
    await saveProfilePhotoPath(database, 'profile/avatar-1.jpg');
    expect(await getProfile(database)).toEqual({ ...PROFILE, firstName: 'Anna', lastName: 'Reyes-Cruz', photoPath: 'profile/avatar-1.jpg' });
  });
});
