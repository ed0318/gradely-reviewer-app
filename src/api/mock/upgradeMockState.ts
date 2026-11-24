import { ANA_ID, buildAnaSeedTransactions, MOCK_STATE_VERSION, type MockState, type MockTransaction } from './mockState';

/** In version 1 (saved before `version` existed) Ana's five seeded ledger rows were ids 1 to 5. */
const VERSION_1_SEED_ROW_COUNT = 5;

type SavedMockState = Omit<MockState, 'version' | 'storePurchases'> & Partial<Pick<MockState, 'version' | 'storePurchases'>>;

/**
 * Brings data the dummy server saved on the phone up to the current seed, so a
 * simulator never has to be wiped when the seed changes. Pure: saved state in,
 * current state out.
 *
 * 1 → 2: Ana's five-row ledger becomes the longer one (21 rows, same 568-unit
 * balance), and the rows made while testing (charges, the 3.5-credit exam)
 * stay, after the seed, with the same idempotency keys, so a retried charge is
 * still a replay. Every row gets a new id (ids stay unique and in time order),
 * Ana's running balances are recomputed, and her balance becomes the ledger's sum.
 * Other accounts are untouched.
 */
export function upgradeMockState(saved: SavedMockState): MockState {
  const version = saved.version ?? 1;
  if (version >= MOCK_STATE_VERSION) return { ...saved, version, storePurchases: saved.storePurchases ?? [] };

  const ana = saved.users.find((user) => user.id === ANA_ID);
  if (!ana) return { ...saved, version: MOCK_STATE_VERSION, storePurchases: saved.storePurchases ?? [] };

  const seedRows = buildAnaSeedTransactions(1);
  const oldRows = [...saved.transactions].sort((left, right) => left.id - right.id);
  const isOldAnaSeedRow = (row: MockTransaction) => row.userId === ANA_ID && row.id <= VERSION_1_SEED_ROW_COUNT;
  const keptRows = oldRows.filter((row) => !isOldAnaSeedRow(row));

  let nextId = seedRows.length + 1;
  let anaBalance = seedRows[seedRows.length - 1].balanceAfterUnits;
  const carriedRows = keptRows.map((row): MockTransaction => {
    const id = nextId++;
    if (row.userId !== ANA_ID) return { ...row, id };
    anaBalance += row.units;
    return { ...row, id, balanceAfterUnits: anaBalance };
  });

  return {
    ...saved,
    version: MOCK_STATE_VERSION,
    users: saved.users.map((user) => (user.id === ANA_ID ? { ...user, balanceUnits: anaBalance } : user)),
    transactions: [...seedRows, ...carriedRows],
    storePurchases: saved.storePurchases ?? [],
    nextTransactionId: nextId,
  };
}
