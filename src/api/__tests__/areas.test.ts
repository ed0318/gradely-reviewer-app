import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The area files: the paths, bodies and field names they send, and the shapes they return. */

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

const BASE_URL = 'http://api.test/v1';
const TOKEN_KEY = 'reviewer.token';

type FetchCall = { path: string; method: string; authorization: string | null; body: unknown };
let fetchCalls: FetchCall[] = [];
let nextAnswer: { status: number; body: unknown } = { status: 200, body: { success: true, message: 'OK.' } };

const USER_PAYLOAD = {
  id: 'user-1',
  email: 'student@example.com',
  first_name: 'Ana',
  last_name: 'Cruz',
  is_email_verified: true,
  has_password: true,
  has_google: false,
  has_apple: false,
  balance_units: 600,
};

const answerWith = (status: number, body: unknown) => {
  nextAnswer = { status, body };
};
const answerWithResult = (result: unknown) => answerWith(200, { success: true, message: 'OK.', result });

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_API_URL', BASE_URL);
  secureStore.clear();
  fetchCalls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      fetchCalls.push({
        path: url.replace(BASE_URL, ''),
        method: init.method ?? 'GET',
        authorization: headers.Authorization ?? null,
        body: init.body ? JSON.parse(init.body as string) : undefined,
      });
      return new Response(JSON.stringify(nextAnswer.body), { status: nextAnswer.status });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('auth', () => {
  it('registers with email and password only, keeps the token and returns the user', async () => {
    answerWith(201, { success: true, message: 'Account created.', result: { token: 'jwt-1', token_type: 'bearer', expires_in: 3600, user: USER_PAYLOAD } });
    const { register } = await import('../auth');

    const user = await register({ email: 'student@example.com', password: 'secret123' });
    expect(fetchCalls[0]).toEqual({
      path: '/auth/register',
      method: 'POST',
      authorization: null,
      body: { email: 'student@example.com', password: 'secret123' },
    });
    expect(user).toEqual({
      id: 'user-1',
      email: 'student@example.com',
      firstName: 'Ana',
      lastName: 'Cruz',
      isEmailVerified: true,
      hasPassword: true,
      hasGoogle: false,
      hasApple: false,
      balanceUnits: 600,
    });
    expect(secureStore.get(TOKEN_KEY)).toBe('jwt-1');
  });

  it('sends the provider ID tokens to the social routes', async () => {
    answerWithResult({ token: 'jwt-2', token_type: 'bearer', expires_in: 3600, user: USER_PAYLOAD });
    const { signInWithApple, signInWithGoogle } = await import('../auth');

    await signInWithGoogle('google-id-token');
    await signInWithApple({ idToken: 'apple-id-token', firstName: 'Ana' });
    expect(fetchCalls.map((call) => [call.path, call.body])).toEqual([
      ['/auth/social/google', { id_token: 'google-id-token' }],
      ['/auth/social/apple', { id_token: 'apple-id-token', first_name: 'Ana', last_name: null }],
    ]);
  });

  it('signs out here even when the server cannot be reached', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Network request failed'))));
    const { signOut } = await import('../auth');
    const { subscribeToSessionEnd } = await import('../session');
    const sessionEnds: string[] = [];
    subscribeToSessionEnd((reason) => sessionEnds.push(reason));

    await signOut();
    expect(secureStore.has(TOKEN_KEY)).toBe(false);
    expect(sessionEnds).toEqual(['signed_out']);
  });

  it('updates the name and deletes the account', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    answerWithResult({ ...USER_PAYLOAD, first_name: 'Ann' });
    const { deleteAccount, updateName } = await import('../auth');

    expect((await updateName('Ann', 'Cruz')).firstName).toBe('Ann');
    answerWith(200, { success: true, message: 'Your account has been deleted.' });
    await deleteAccount();
    expect(fetchCalls.map((call) => [call.method, call.path, call.body])).toEqual([
      ['PATCH', '/me', { first_name: 'Ann', last_name: 'Cruz' }],
      ['DELETE', '/me', undefined],
    ]);
    // The session ends only once the person has seen the account is gone.
    expect(secureStore.get(TOKEN_KEY)).toBe('jwt-1');
  });

  it('sends password reset requests without a token', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    const { requestPasswordReset, resetPassword } = await import('../auth');
    await requestPasswordReset('student@example.com');
    await resetPassword({ email: 'student@example.com', code: '123456', password: 'newsecret1' });
    expect(fetchCalls.map((call) => [call.path, call.authorization])).toEqual([
      ['/auth/password/forgot', null],
      ['/auth/password/reset', null],
    ]);
  });
});

describe('credits', () => {
  it('charges an exam with its idempotency key and reads the new balance', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    answerWith(201, {
      success: true,
      message: 'Exam charged.',
      result: {
        charge_id: 42,
        idempotency_key: '7f1c6c1e-4f53-4c2a-9a3e-1b2c3d4e5f60',
        exam_name: 'Cell biology quiz',
        item_count: 30,
        units_charged: 30,
        balance_units: 570,
        is_replay: false,
        charged_at: '2026-11-24T10:00:00+08:00',
      },
    });
    const { chargeExam } = await import('../credits');

    const charge = await chargeExam({ idempotencyKey: '7f1c6c1e-4f53-4c2a-9a3e-1b2c3d4e5f60', examName: 'Cell biology quiz', itemCount: 30 });
    expect(fetchCalls[0]).toMatchObject({
      path: '/exams/charge',
      method: 'POST',
      authorization: 'Bearer jwt-1',
      body: { idempotency_key: '7f1c6c1e-4f53-4c2a-9a3e-1b2c3d4e5f60', exam_name: 'Cell biology quiz', item_count: 30 },
    });
    expect(charge).toMatchObject({ transactionId: 42, unitsCharged: 30, balanceUnits: 570, isReplay: false });
  });

  it('pages credit history 10 at a time, searching by exam name', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    answerWith(200, {
      success: true,
      message: 'OK.',
      results: [{ id: 7, type: 'exam_charge', units: -30, balance_after_units: 570, exam_name: 'Quiz', item_count: 30, created_at: null }],
      pagination: { total: 1, per_page: 10, current_page: 1, last_page: 1, from: 1, to: 1 },
    });
    const { listCreditTransactions } = await import('../credits');

    const history = await listCreditTransactions({ page: 1, search: '  Quiz ' });
    expect(fetchCalls[0].path).toBe('/credits/transactions?page=1&per_page=10&search=Quiz&sort=newest');
    expect(history.transactions).toEqual([
      { id: 7, type: 'exam_charge', units: -30, balanceAfterUnits: 570, examName: 'Quiz', itemCount: 30, createdAt: null },
    ]);
    expect(history.pagination?.lastPage).toBe(1);
  });
});

describe('purchases, hand-over and app version', () => {
  it('lists the packs publicly and refreshes purchases with the token', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    answerWith(200, {
      success: true,
      message: 'OK.',
      results: [{ id: 1, store_product_id: 'reviewer_credits_150', credits: 150, units: 600, price_centavos: 14_900 }],
    });
    const { listProducts, refreshPurchases } = await import('../purchases');

    expect(await listProducts()).toEqual([{ id: 1, storeProductId: 'reviewer_credits_150', credits: 150, units: 600, priceCentavos: 14_900 }]);
    answerWithResult({ credited_units: 600, credited_purchase_count: 1, balance_units: 1_200 });
    expect(await refreshPurchases()).toEqual({ creditedUnits: 600, creditedPurchaseCount: 1, balanceUnits: 1_200 });
    expect(fetchCalls.map((call) => [call.path, call.authorization])).toEqual([
      ['/products', null],
      ['/purchases/refresh', 'Bearer jwt-1'],
    ]);
  });

  it('sends and confirms a hand-over code', async () => {
    secureStore.set(TOKEN_KEY, 'jwt-1');
    const { confirmHandover, sendHandoverCode } = await import('../handover');

    answerWithResult({ owner_gone: false, sent_to: 'a***@example.com' });
    expect(await sendHandoverCode('owner-1')).toEqual({ isOwnerGone: false, sentTo: 'a***@example.com' });
    answerWithResult({ owner_gone: false, account_id: 'owner-1', file_key: 'a2V5' });
    expect(await confirmHandover({ ownerId: 'owner-1', code: '123456', saltBase64: 'c2FsdA==' })).toEqual({
      isOwnerGone: false,
      ownerAccountId: 'owner-1',
      fileKey: 'a2V5',
    });
    expect(fetchCalls[1].body).toEqual({ owner_id: 'owner-1', code: '123456', salt: 'c2FsdA==' });
  });

  it('reads the app versions per platform', async () => {
    answerWith(200, { success: true, message: 'App versions.', results: [{ platform: 'ios', min_supported_version: '1.0', latest_version: '1.2' }] });
    const { fetchAppVersions } = await import('../appVersion');
    expect(await fetchAppVersions()).toEqual([{ platform: 'ios', minSupportedVersion: '1.0', latestVersion: '1.2' }]);
    expect(fetchCalls[0]).toMatchObject({ path: '/app/version', authorization: null });
  });
});
