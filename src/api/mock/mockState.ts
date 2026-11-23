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

export type MockState = {
  users: MockUser[];
  transactions: MockTransaction[];
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

/** Ana from the mockup: 150 credits bought, three exams taken, 142 left (568 units). */
export function createSeedState(): MockState {
  const ana: MockUser = {
    id: '0b0f5d6e-1111-4222-8333-944455556666',
    email: 'ana@example.com',
    password: 'reviewer123',
    firstName: 'Ana',
    lastName: 'Reyes',
    balanceUnits: 568,
    backupKey: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
    hasGoogle: false,
    hasApple: false,
  };
  const seed: Array<Omit<MockTransaction, 'id' | 'userId' | 'balanceAfterUnits'>> = [
    { type: 'purchase', units: 600, idempotencyKey: null, examName: null, itemCount: null, createdAt: '2026-11-20T09:00:00+08:00' },
    { type: 'exam_charge', units: -20, idempotencyKey: 'seed-1', examName: 'Pharmacology quick check', itemCount: 20, createdAt: '2026-11-21T19:10:00+08:00' },
    { type: 'exam_charge', units: -60, idempotencyKey: 'seed-2', examName: 'LET Gen Ed — English', itemCount: 60, createdAt: '2026-11-22T20:30:00+08:00' },
    { type: 'exam_charge', units: -30, idempotencyKey: 'seed-3', examName: 'Civil Service — Numerical drill', itemCount: 30, createdAt: '2026-11-23T18:45:00+08:00' },
  ];
  let balance = 0;
  const transactions = seed.map((row, index) => {
    balance += row.units;
    return { ...row, id: index + 1, userId: ana.id, balanceAfterUnits: balance };
  });
  // 600 - 110 = 490 from the ledger; a +78 adjustment brings it to the mockup's 142 credits.
  transactions.push({
    id: transactions.length + 1,
    userId: ana.id,
    type: 'adjustment',
    units: 78,
    balanceAfterUnits: balance + 78,
    idempotencyKey: null,
    examName: null,
    itemCount: null,
    createdAt: '2026-11-23T21:00:00+08:00',
  });
  return { users: [ana], transactions, tokens: {}, nextTransactionId: transactions.length + 1, nextTokenNumber: 1 };
}
