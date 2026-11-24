/**
 * The dummy server's data, shaped like reviewer-api's tables so every answer
 * can be built the way its Resources build them. Credits are integer units.
 */
export type MockUser = {
  id: string;
  email: string;
  password: string | null;
  firstName: string;
  lastName: string;
  balanceUnits: number;
  /** 32 random bytes, base64: what a hand-over backup key is derived from. */
  backupKey: string;
  hasGoogle: boolean;
  hasApple: boolean;
};

export type MockTransaction = {
  id: number;
  userId: string;
  type: 'purchase' | 'exam_charge' | 'adjustment' | 'refund';
  units: number;
  balanceAfterUnits: number;
  idempotencyKey: string | null;
  examName: string | null;
  itemCount: number | null;
  createdAt: string;
};

/** A purchase the dummy store made, waiting for /purchases/refresh to credit it (once). */
export type MockStorePurchase = {
  /** The fake store's own transaction id: what the server credits once per. */
  storeTransactionId: string;
  userId: string;
  storeProductId: string;
  purchasedAt: string;
  /** The ledger row that credited it; null until /purchases/refresh has run. */
  creditedTransactionId: number | null;
};

export type MockState = {
  /** Which seed this data was made from; `upgradeMockState` brings older saved data up to date. */
  version: number;
  users: MockUser[];
  transactions: MockTransaction[];
  storePurchases: MockStorePurchase[];
  /** token → user id. */
  tokens: Record<string, string>;
  nextTransactionId: number;
  nextTokenNumber: number;
};

/** The code the dummy server accepts for a password reset and a hand-over. */
export const MOCK_CODE = '123456';

export const MOCK_PRODUCTS = [
  { id: 1, store_product_id: 'reviewer_credits_150', credits: 150, units: 600, price_centavos: 14_900 },
  { id: 2, store_product_id: 'reviewer_credits_280', credits: 280, units: 1_120, price_centavos: 24_900 },
  { id: 3, store_product_id: 'reviewer_credits_380', credits: 380, units: 1_520, price_centavos: 34_900 },
];

export const MOCK_APP_VERSIONS = [
  { platform: 'ios', min_supported_version: '1.0', latest_version: '1.0' },
  { platform: 'android', min_supported_version: '1.0', latest_version: '1.0' },
];

/** Bump when the seed changes, and teach `upgradeMockState` the step. */
export const MOCK_STATE_VERSION = 2;

type SeedRow = { at: string; type: 'purchase' | 'exam_charge'; units: number; examName?: string };
const charge = (at: string, examName: string, itemCount: number): SeedRow => ({ at, type: 'exam_charge', units: -itemCount, examName });
const purchase = (at: string, credits: number): SeedRow => ({ at, type: 'purchase', units: credits * 4 });

/**
 * Ana's ledger, oldest first: two 150-credit packs and nineteen exams named like
 * the dummy exams on the phone (src/db/dev), 21 rows so history has three pages.
 * It adds up to 568 units, the mockup's 142 credits.
 */
const ANA_SEED_LEDGER: SeedRow[] = [
  purchase('2026-10-25T10:00:00+08:00', 150),
  charge('2026-10-26T19:10:00+08:00', 'Civil Service — Numerical drill', 30),
  charge('2026-10-27T20:05:00+08:00', 'Pharmacology quick check', 20),
  charge('2026-10-28T19:30:00+08:00', 'LET Gen Ed — English', 60),
  charge('2026-10-30T20:30:00+08:00', 'Civil Service — Numerical drill', 30),
  charge('2026-11-02T21:15:00+08:00', 'Pharmacology quick check', 20),
  charge('2026-11-04T18:00:00+08:00', 'LET Gen Ed — English', 60),
  charge('2026-11-06T19:20:00+08:00', 'Civil Service — Numerical drill', 30),
  purchase('2026-11-08T16:45:00+08:00', 150),
  charge('2026-11-10T20:05:00+08:00', 'Pharmacology quick check', 20),
  charge('2026-11-12T19:30:00+08:00', 'Civil Service — Numerical drill', 40),
  charge('2026-11-14T21:40:00+08:00', 'Civil Service — Numerical drill', 30),
  charge('2026-11-15T18:11:00+08:00', 'LET Gen Ed — English', 50),
  charge('2026-11-17T19:05:00+08:00', 'Pharmacology quick check', 20),
  charge('2026-11-19T17:32:00+08:00', 'Civil Service — Numerical drill', 30),
  charge('2026-11-20T19:02:00+08:00', 'LET Gen Ed — English', 60),
  charge('2026-11-21T08:30:00+08:00', 'Pharmacology quick check', 20),
  charge('2026-11-21T21:10:00+08:00', 'Civil Service — Numerical drill', 32),
  charge('2026-11-22T20:30:00+08:00', 'Civil Service — Numerical drill', 30),
  charge('2026-11-23T18:22:00+08:00', 'Pharmacology quick check', 20),
  charge('2026-11-23T20:06:00+08:00', 'Numerical drill #5', 30),
];

export const ANA_ID = '0b0f5d6e-1111-4222-8333-944455556666';

/** Ana's seed ledger as rows with ids from `firstId`, balances running from 0. */
export function buildAnaSeedTransactions(firstId: number): MockTransaction[] {
  let balance = 0;
  return ANA_SEED_LEDGER.map((row, index) => {
    balance += row.units;
    return {
      id: firstId + index,
      userId: ANA_ID,
      type: row.type,
      units: row.units,
      balanceAfterUnits: balance,
      idempotencyKey: row.type === 'exam_charge' ? `seed-${index + 1}` : null,
      examName: row.examName ?? null,
      itemCount: row.type === 'exam_charge' ? -row.units : null,
      createdAt: row.at,
    };
  });
}

/** Ana from the mockup: 300 credits bought, nineteen exams taken, 142 left (568 units). */
export function createSeedState(): MockState {
  const transactions = buildAnaSeedTransactions(1);
  const ana: MockUser = {
    id: ANA_ID,
    email: 'ana@example.com',
    password: 'reviewer123',
    firstName: 'Ana',
    lastName: 'Reyes',
    balanceUnits: transactions[transactions.length - 1].balanceAfterUnits,
    backupKey: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
    hasGoogle: false,
    hasApple: false,
  };
  return { version: MOCK_STATE_VERSION, users: [ana], transactions, storePurchases: [], tokens: {}, nextTransactionId: transactions.length + 1, nextTokenNumber: 1 };
}
