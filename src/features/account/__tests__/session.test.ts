import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountUser } from '@/api/auth';
import { openMigratedMemoryDatabase, type TestDatabase } from '@/db/testing/memoryDatabase';

/**
 * The session steps against a real SQLite database: whose phone this is,
 * when the hand-over opens, and what the erase leaves behind.
 */

const secureStore = new Map<string, string>();
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => secureStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    secureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    secureStore.delete(key);
  },
}));

let database: TestDatabase;
vi.mock('@/db/client', () => ({
  openDatabase: async () => database,
  queueWrite: async <T,>(work: (writer: TestDatabase) => Promise<T>) => work(database),
}));

const fetchMe = vi.fn<() => Promise<AccountUser>>();
vi.mock('@/api/auth', () => ({ fetchMe: () => fetchMe() }));

const deletedPhotoFolders: number[] = [];
vi.mock('../profilePhoto', () => ({ deleteAllPhotoFiles: () => deletedPhotoFolders.push(1) }));

const buildUser = (id: string, firstName: string, balanceUnits = 600): AccountUser => ({
  id,
  email: `${firstName.toLowerCase()}@example.com`,
  firstName,
  lastName: 'Reyes',
  isEmailVerified: true,
  hasPassword: true,
  hasGoogle: false,
  hasApple: false,
  balanceUnits,
});

const ANA = buildUser('account-ana', 'Ana');
const BEN = buildUser('account-ben', 'Ben');

async function addTopic() {
  const { insertTopic } = await import('@/db/repositories/topics');
  const { buildTopic } = await import('@/db/testing/fixtures');
  await insertTopic(database, buildTopic());
}

beforeEach(async () => {
  vi.resetModules();
  secureStore.clear();
  deletedPhotoFolders.length = 0;
  fetchMe.mockReset();
  database = await openMigratedMemoryDatabase();
});

describe('signing in', () => {
  it('makes the first account the owner of an empty phone', async () => {
    const { establishSession } = await import('../session');
    const { getProfile, getSettings } = await import('@/db/repositories/account');

    const state = await establishSession(ANA);
    expect(state.kind).toBe('signed_in');
    expect(await getProfile(database)).toMatchObject({ accountId: 'account-ana', firstName: 'Ana', photoPath: null });
    expect((await getSettings(database)).balanceUnitsCache).toBe(600);
  });

  it('always opens the hand-over for a second account on a phone with topics', async () => {
    const { establishSession } = await import('../session');
    await establishSession(ANA);
    await addTopic();

    const state = await establishSession(BEN);
    expect(state).toMatchObject({
      kind: 'handover',
      account: { id: 'account-ben' },
      owner: { accountId: 'account-ana', firstName: 'Ana', summary: { topicCount: 1, questionCount: 0, examCount: 0 } },
    });
    // Nothing of Ana's was touched.
    const { getProfile } = await import('@/db/repositories/account');
    expect((await getProfile(database))?.accountId).toBe('account-ana');
  });

  it('lets a second account take a phone the owner left empty, without a hand-over', async () => {
    const { establishSession } = await import('../session');
    const { getProfile, saveProfilePhotoPath } = await import('@/db/repositories/account');
    await establishSession(ANA);
    await saveProfilePhotoPath(database, 'profile/ana.jpg');

    expect((await establishSession(BEN)).kind).toBe('signed_in');
    expect(await getProfile(database)).toMatchObject({ accountId: 'account-ben', photoPath: null });
    expect(deletedPhotoFolders).toHaveLength(1);
  });

  it('keeps the owner their photo when they sign back in', async () => {
    const { establishSession } = await import('../session');
    const { getProfile, saveProfilePhotoPath } = await import('@/db/repositories/account');
    await establishSession(ANA);
    await saveProfilePhotoPath(database, 'profile/ana.jpg');
    await addTopic();

    expect((await establishSession(ANA)).kind).toBe('signed_in');
    expect((await getProfile(database))?.photoPath).toBe('profile/ana.jpg');
  });
});

describe('onboarding', () => {
  it('opens setup for an account with no name yet, and only for that', async () => {
    const { establishSession, needsOnboarding } = await import('../session');
    const unnamed = { ...ANA, firstName: '', lastName: '' };
    expect((await establishSession(unnamed)).kind).toBe('onboarding');
    expect(needsOnboarding({ firstName: 'Ana', lastName: ' ' })).toBe(true);
    expect(needsOnboarding({ firstName: 'Ana', lastName: 'Reyes' })).toBe(false);
  });

  it('reopens setup after a restart before it was finished', async () => {
    const { establishSession, restoreSession } = await import('../session');
    const { saveToken } = await import('@/api/tokens');
    await establishSession({ ...ANA, firstName: '', lastName: '' });
    await saveToken('token-ana');
    expect((await restoreSession()).kind).toBe('onboarding');
  });

  it('still sends a second, unnamed account on a used phone to the hand-over first', async () => {
    const { establishSession } = await import('../session');
    await establishSession(ANA);
    await addTopic();
    expect((await establishSession({ ...BEN, firstName: '', lastName: '' })).kind).toBe('handover');
  });
});

describe('the hand-over erase', () => {
  it("erases the owner's data and gives the phone to the signed-in account", async () => {
    const { completeHandover, establishSession } = await import('../session');
    const { summarizeLocalData } = await import('@/db/repositories/localData');
    await establishSession(ANA);
    await addTopic();
    const handover = await establishSession(BEN);
    if (handover.kind !== 'handover') throw new Error('expected the hand-over');

    const state = await completeHandover(handover.account);
    expect(state).toMatchObject({ kind: 'signed_in', profile: { accountId: 'account-ben' } });
    expect(await summarizeLocalData(database)).toEqual({ topicCount: 0, questionCount: 0, examCount: 0 });
  });
});

describe('launching', () => {
  it('is signed out with no token, even with a profile on the phone', async () => {
    const { establishSession, restoreSession } = await import('../session');
    await establishSession(ANA);
    expect(await restoreSession()).toEqual({ kind: 'signed_out' });
  });

  it('restores offline from the token and the saved account, without asking /me', async () => {
    const { establishSession, restoreSession } = await import('../session');
    const { saveToken } = await import('@/api/tokens');
    await establishSession(ANA);
    await saveToken('token-ana');

    expect(await restoreSession()).toMatchObject({ kind: 'signed_in', account: { id: 'account-ana' } });
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it('reopens the hand-over after a restart in the middle of one', async () => {
    const { establishSession, restoreSession } = await import('../session');
    const { saveToken } = await import('@/api/tokens');
    await establishSession(ANA);
    await addTopic();
    await establishSession(BEN);
    await saveToken('token-ben');

    expect((await restoreSession()).kind).toBe('handover');
  });

  it('asks /me when there is a token but no saved account, and signs out if it cannot', async () => {
    const { restoreSession } = await import('../session');
    const { saveToken } = await import('@/api/tokens');
    await saveToken('token-ana');
    fetchMe.mockResolvedValueOnce(ANA);
    expect((await restoreSession()).kind).toBe('signed_in');

    secureStore.delete('reviewer.account');
    fetchMe.mockRejectedValueOnce(new Error('offline'));
    expect(await restoreSession()).toEqual({ kind: 'signed_out' });
  });
});
