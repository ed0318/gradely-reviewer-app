import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeBase64, encodeBase64 } from '@/lib/base64';

/** The dummy server, driven through the real client and area files, as the app uses it. */

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
let savedState: unknown = null;
let idCounter = 0;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_API_MOCK', '1');
  vi.stubEnv('EXPO_PUBLIC_API_URL', '');
  vi.stubGlobal('__DEV__', true);
  vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 400 });
  secureStore.clear();
  savedState = null;
  (await import('../mock/mockTransport')).configureMockServer({
    store: { load: () => savedState as never, save: (state) => (savedState = JSON.parse(JSON.stringify(state))) },
    createId: () => `mock-id-${++idCounter}`,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('dummy API', () => {
  it('signs in the seeded account and reads its balance and history', async () => {
    const { signIn, fetchMe } = await import('../auth');
    const { listCreditTransactions } = await import('../credits');

    const user = await signIn('ana@example.com', 'reviewer123');
    expect(user).toMatchObject({ firstName: 'Ana', lastName: 'Reyes', balanceUnits: 568 });
    expect((await fetchMe()).email).toBe('ana@example.com');

    const history = await listCreditTransactions({ page: 1, perPage: 2 });
    expect(history.transactions.map((row) => row.examName)).toEqual(['Numerical drill #5', 'Pharmacology quick check']);
    expect(history.pagination).toMatchObject({ total: 21, lastPage: 11 });
    const searched = await listCreditTransactions({ page: 1, search: 'english' });
    expect(searched.transactions.map((row) => row.examName)).toEqual(Array(4).fill('LET Gen Ed — English'));
  });

  it('refuses a wrong password with the real error code', async () => {
    const { signIn } = await import('../auth');
    await expect(signIn('ana@example.com', 'wrong')).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' });
  });

  it('registers without a name, then names the account, and refuses a taken email', async () => {
    const { register, updateName } = await import('../auth');
    const user = await register({ email: 'ben@example.com', password: 'reviewer123' });
    expect(user).toMatchObject({ firstName: '', balanceUnits: 0 });
    expect((await updateName('Ben', 'Cruz')).firstName).toBe('Ben');
    await expect(register({ email: 'ANA@example.com', password: 'reviewer123' })).rejects.toMatchObject({ status: 409, code: 'email_taken' });
    await expect(register({ email: 'nope', password: 'short' })).rejects.toMatchObject({ status: 422, code: 'validation_failed' });
  });

  it('charges once per key, and refuses a short balance with 402', async () => {
    const { signIn, register } = await import('../auth');
    const { chargeExam } = await import('../credits');
    await signIn('ana@example.com', 'reviewer123');

    const first = await chargeExam({ idempotencyKey: 'key-1', examName: 'Drill', itemCount: 30 });
    const again = await chargeExam({ idempotencyKey: 'key-1', examName: 'Drill', itemCount: 30 });
    expect(first).toMatchObject({ unitsCharged: 30, balanceUnits: 538, isReplay: false });
    expect(again).toMatchObject({ transactionId: first.transactionId, balanceUnits: 538, isReplay: true });
    await expect(chargeExam({ idempotencyKey: 'key-1', examName: 'Other', itemCount: 30 })).rejects.toMatchObject({ code: 'idempotency_key_reused' });

    await register({ email: 'empty@example.com', password: 'reviewer123' });
    await expect(chargeExam({ idempotencyKey: 'key-2', examName: 'Drill', itemCount: 10 })).rejects.toMatchObject({ status: 402, code: 'insufficient_credits' });
  });

  it('keeps its data between launches, so a session survives a restart', async () => {
    const { signIn } = await import('../auth');
    await signIn('ana@example.com', 'reviewer123');

    (await import('../mock/mockTransport')).resetMockServer();
    const { fetchMe } = await import('../auth');
    expect((await fetchMe()).firstName).toBe('Ana');
  });

  it("releases the owner's file key for the hand-over code, as the server derives it", async () => {
    const { signIn } = await import('../auth');
    const { confirmHandover, sendHandoverCode } = await import('../handover');
    await signIn('ana@example.com', 'reviewer123');
    const ownerId = '0b0f5d6e-1111-4222-8333-944455556666';

    expect(await sendHandoverCode(ownerId)).toEqual({ isOwnerGone: false, sentTo: 'a•••a@example.com' });
    await expect(confirmHandover({ ownerId, code: '000000', saltBase64: encodeBase64(new Uint8Array(16)) })).rejects.toMatchObject({ code: 'invalid_code' });

    const salt = new Uint8Array(16).fill(2);
    const confirmation = await confirmHandover({ ownerId, code: '123456', saltBase64: encodeBase64(salt) });
    const expected = hkdf(sha256, new Uint8Array(32).fill(7), salt, new TextEncoder().encode(`gradely-reviewer-backup.v1:${ownerId}`), 32);
    expect(confirmation.fileKey).toBe(encodeBase64(expected));
    expect(decodeBase64(confirmation.fileKey ?? '')).toHaveLength(32);
    expect(await sendHandoverCode('gone-owner')).toEqual({ isOwnerGone: true, sentTo: null });
  });

  it('answers 401 without a token, which the client treats as a refused session', async () => {
    const { fetchMe } = await import('../auth');
    await expect(fetchMe()).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
  });
});
