import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The dummy store and the dummy server's ledger, driven through the real client and area files. */

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

const ANA_ID = '0b0f5d6e-1111-4222-8333-944455556666';
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
  idCounter = 0;
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

/** The sheet's side of the dummy store: waits for the request and answers it. */
async function buyWithDummyStore(storeProductId: string, answer: boolean) {
  const bridge = await import('../mock/mockStoreSheetBridge');
  const { dummyCreditStore } = await import('../mock/mockCreditStore');
  const { listProducts } = await import('../purchases');
  const product = (await listProducts()).find((candidate) => candidate.storeProductId === storeProductId);
  if (!product) throw new Error('no such pack');
  const removeSheet = bridge.registerDummyStoreSheet();
  const purchase = dummyCreditStore.purchase(product, ANA_ID);
  await vi.waitFor(() => expect(bridge.getDummyStoreRequest()).not.toBeNull());
  expect(bridge.getDummyStoreRequest()).toMatchObject({ storeProductId, credits: product.credits });
  bridge.settleDummyStoreRequest(answer);
  const result = await purchase;
  removeSheet();
  return result;
}

describe('the dummy store', () => {
  it('"buys" a pack, and the refresh credits the right units, once', async () => {
    const { signIn } = await import('../auth');
    const { refreshPurchases } = await import('../purchases');
    await signIn('ana@example.com', 'reviewer123');

    expect(await refreshPurchases()).toEqual({ creditedUnits: 0, creditedPurchaseCount: 0, balanceUnits: 568 });
    expect(await buyWithDummyStore('reviewer_credits_280', true)).toBe('purchased');
    // Paid, but not credited until the server is asked.
    expect(await refreshPurchases()).toEqual({ creditedUnits: 1_120, creditedPurchaseCount: 1, balanceUnits: 1_688 });
    // Asked again, or again after the app restarts: nothing more.
    expect(await refreshPurchases()).toEqual({ creditedUnits: 0, creditedPurchaseCount: 0, balanceUnits: 1_688 });
    (await import('../mock/mockTransport')).resetMockServer();
    expect(await refreshPurchases()).toEqual({ creditedUnits: 0, creditedPurchaseCount: 0, balanceUnits: 1_688 });
  });

  it('credits a purchase left unconfirmed the next time the server is asked (killed mid-purchase)', async () => {
    const { signIn } = await import('../auth');
    const { refreshPurchases } = await import('../purchases');
    await signIn('ana@example.com', 'reviewer123');
    await buyWithDummyStore('reviewer_credits_150', true);
    // The app is killed here: the server's data is on the phone, the refresh never ran.
    (await import('../mock/mockTransport')).resetMockServer();
    expect(await refreshPurchases()).toMatchObject({ creditedUnits: 600, balanceUnits: 1_168 });
  });

  it('credits two purchases as two, and the same fake transaction id as one', async () => {
    const { signIn } = await import('../auth');
    const { refreshPurchases } = await import('../purchases');
    await signIn('ana@example.com', 'reviewer123');
    await buyWithDummyStore('reviewer_credits_150', true);
    await buyWithDummyStore('reviewer_credits_380', true);
    expect(await refreshPurchases()).toEqual({ creditedUnits: 600 + 1_520, creditedPurchaseCount: 2, balanceUnits: 568 + 2_120 });

    // Replaying a store transaction directly changes nothing.
    const { runOnMockServer } = await import('../mock/mockTransport');
    const { recordMockStorePurchase } = await import('../mock/mockServer');
    runOnMockServer((context) => {
      const first = context.state.storePurchases[0];
      recordMockStorePurchase(context, ANA_ID, first.storeProductId, first.storeTransactionId);
    });
    expect(await refreshPurchases()).toMatchObject({ creditedUnits: 0, balanceUnits: 568 + 2_120 });
  });

  it('writes the purchase into the history as a green-side +units row', async () => {
    const { signIn } = await import('../auth');
    const { refreshPurchases } = await import('../purchases');
    const { listCreditTransactions } = await import('../credits');
    await signIn('ana@example.com', 'reviewer123');
    await buyWithDummyStore('reviewer_credits_280', true);
    await refreshPurchases();
    const { transactions } = await listCreditTransactions({ page: 1, perPage: 1 });
    expect(transactions[0]).toMatchObject({ type: 'purchase', units: 1_120, balanceAfterUnits: 1_688 });
  });

  it('buys nothing when cancelled in the sheet, or when no sheet is on screen', async () => {
    const { signIn } = await import('../auth');
    const { refreshPurchases } = await import('../purchases');
    const { dummyCreditStore } = await import('../mock/mockCreditStore');
    await signIn('ana@example.com', 'reviewer123');
    expect(await buyWithDummyStore('reviewer_credits_280', false)).toBe('cancelled');
    expect(await dummyCreditStore.purchase({ id: 1, storeProductId: 'reviewer_credits_150', credits: 150, units: 600, priceCentavos: 14_900 }, ANA_ID)).toBe('cancelled');
    expect(await refreshPurchases()).toMatchObject({ creditedUnits: 0, balanceUnits: 568 });
  });

  it('refuses to sell outside a development build', async () => {
    vi.stubGlobal('__DEV__', false);
    vi.resetModules();
    const { dummyCreditStore, isDummyStoreAvailable } = await import('../mock/mockCreditStore');
    expect(isDummyStoreAvailable).toBe(false);
    await expect(dummyCreditStore.purchase({ id: 1, storeProductId: 'reviewer_credits_150', credits: 150, units: 600, priceCentavos: 14_900 }, ANA_ID)).rejects.toMatchObject({ name: 'StoreError' });
  });
});

describe('the dummy ledger seed', () => {
  it('has 21 rows that add up to the balance, with matching running balances', async () => {
    const { createSeedState } = await import('../mock/mockState');
    const state = createSeedState();
    const sum = state.transactions.reduce((total, row) => total + row.units, 0);
    expect(state.transactions).toHaveLength(21);
    expect(sum).toBe(568);
    expect(state.users[0].balanceUnits).toBe(568);
    let running = 0;
    for (const row of state.transactions) {
      running += row.units;
      expect(row.balanceAfterUnits).toBe(running);
      expect(running).toBeGreaterThanOrEqual(0);
    }
    expect(state.transactions.filter((row) => row.type === 'purchase')).toHaveLength(2);
    const names = new Set(state.transactions.map((row) => row.examName).filter(Boolean));
    expect(names).toEqual(new Set(['Civil Service — Numerical drill', 'LET Gen Ed — English', 'Pharmacology quick check', 'Numerical drill #5']));
  });

  it('pages, sorts and filters on the server through the real area file', async () => {
    const { signIn } = await import('../auth');
    const { listCreditTransactions } = await import('../credits');
    await signIn('ana@example.com', 'reviewer123');

    const first = await listCreditTransactions({ page: 1 });
    expect(first.transactions).toHaveLength(10);
    expect(first.pagination).toMatchObject({ total: 21, lastPage: 3, from: 1, to: 10, currentPage: 1 });
    const last = await listCreditTransactions({ page: 3 });
    expect(last.transactions).toHaveLength(1);
    expect(last.pagination).toMatchObject({ from: 21, to: 21 });

    const oldest = await listCreditTransactions({ page: 1, sort: 'oldest', perPage: 2 });
    expect(oldest.transactions.map((row) => row.type)).toEqual(['purchase', 'exam_charge']);
    const newest = await listCreditTransactions({ page: 1, sort: 'newest', perPage: 1 });
    expect(newest.transactions[0].examName).toBe('Numerical drill #5');

    const filtered = await listCreditTransactions({ page: 1, search: 'pharmacology' });
    expect(filtered.pagination).toMatchObject({ total: 6 });
    expect(filtered.transactions.every((row) => row.examName === 'Pharmacology quick check')).toBe(true);
    const none = await listCreditTransactions({ page: 1, search: 'nothing like this' });
    expect(none.transactions).toEqual([]);
    expect(none.pagination).toMatchObject({ total: 0, from: null });
  });
});

describe('upgrading saved dummy data', () => {
  it('replaces the old five-row ledger with the new one and keeps what testing added', async () => {
    const { upgradeMockState } = await import('../mock/upgradeMockState');
    const old = {
      users: [{ id: ANA_ID, email: 'ana@example.com', password: 'reviewer123', firstName: 'Ana', lastName: 'Reyes', balanceUnits: 554, backupKey: 'k', hasGoogle: false, hasApple: false }],
      transactions: [
        { id: 1, userId: ANA_ID, type: 'purchase', units: 600, balanceAfterUnits: 600, idempotencyKey: null, examName: null, itemCount: null, createdAt: '2026-11-20T09:00:00+08:00' },
        { id: 2, userId: ANA_ID, type: 'exam_charge', units: -20, balanceAfterUnits: 580, idempotencyKey: 'seed-1', examName: 'Pharmacology quick check', itemCount: 20, createdAt: '2026-11-21T19:10:00+08:00' },
        { id: 3, userId: ANA_ID, type: 'exam_charge', units: -60, balanceAfterUnits: 520, idempotencyKey: 'seed-2', examName: 'LET Gen Ed — English', itemCount: 60, createdAt: '2026-11-22T20:30:00+08:00' },
        { id: 4, userId: ANA_ID, type: 'exam_charge', units: -30, balanceAfterUnits: 490, idempotencyKey: 'seed-3', examName: 'Civil Service — Numerical drill', itemCount: 30, createdAt: '2026-11-23T18:45:00+08:00' },
        { id: 5, userId: ANA_ID, type: 'adjustment', units: 78, balanceAfterUnits: 568, idempotencyKey: null, examName: null, itemCount: null, createdAt: '2026-11-23T21:00:00+08:00' },
        { id: 6, userId: ANA_ID, type: 'exam_charge', units: -14, balanceAfterUnits: 554, idempotencyKey: 'tested-key', examName: 'Tried it', itemCount: 14, createdAt: '2026-11-24T10:00:00+08:00' },
        { id: 7, userId: 'someone-else', type: 'adjustment', units: 40, balanceAfterUnits: 40, idempotencyKey: null, examName: null, itemCount: null, createdAt: '2026-11-24T11:00:00+08:00' },
      ],
      tokens: { 'mock-token-1': ANA_ID },
      nextTransactionId: 8,
      nextTokenNumber: 2,
    } as never;

    const upgraded = upgradeMockState(old);
    const anaRows = upgraded.transactions.filter((row) => row.userId === ANA_ID);
    expect(upgraded.version).toBe(2);
    expect(upgraded.storePurchases).toEqual([]);
    expect(anaRows).toHaveLength(22);
    expect(anaRows[21]).toMatchObject({ idempotencyKey: 'tested-key', units: -14, balanceAfterUnits: 554 });
    expect(upgraded.users[0].balanceUnits).toBe(554);
    expect(anaRows.reduce((total, row) => total + row.units, 0)).toBe(554);
    expect(new Set(upgraded.transactions.map((row) => row.id)).size).toBe(upgraded.transactions.length);
    expect(upgraded.nextTransactionId).toBe(Math.max(...upgraded.transactions.map((row) => row.id)) + 1);
    expect(upgraded.tokens).toEqual({ 'mock-token-1': ANA_ID });
    expect(upgraded.transactions.find((row) => row.userId === 'someone-else')).toMatchObject({ units: 40, balanceAfterUnits: 40 });

    // Already current: untouched.
    expect(upgradeMockState(upgraded)).toEqual(upgraded);
  });

  it('upgrades saved data on load, so a retried charge from before is still a replay', async () => {
    const { signIn } = await import('../auth');
    const { chargeExam } = await import('../credits');
    // Saved by an older build: no version.
    const { createSeedState } = await import('../mock/mockState');
    const seed = createSeedState();
    const legacy = { ...seed, version: undefined, storePurchases: undefined, transactions: seed.transactions.slice(0, 5) } as never;
    savedState = legacy;
    (await import('../mock/mockTransport')).resetMockServer();

    await signIn('ana@example.com', 'reviewer123');
    const charge = await chargeExam({ idempotencyKey: 'after-upgrade', examName: 'Drill', itemCount: 10 });
    expect(charge.balanceUnits).toBeGreaterThan(0);
    expect((savedState as { version: number }).version).toBe(2);
  });
});
