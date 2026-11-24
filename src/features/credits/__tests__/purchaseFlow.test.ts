import { describe, expect, it } from 'vitest';
import { ApiError, OfflineError, StoreError } from '@/api/errors';
import type { CreditProduct, PurchaseSync } from '@/api/purchases';
import { decideLowCreditAlert } from '../lowCreditAlert';
import { CONFIRM_DELAYS_MS, confirmPurchase, runPurchase, settlePurchases, type PurchasePorts } from '../purchaseFlow';

const PACK: CreditProduct = { id: 2, storeProductId: 'reviewer_credits_280', credits: 280, units: 1_120, priceCentavos: 24_900 };

type Answer = PurchaseSync | Error;

/** A server that answers `refresh` from a script (the last answer repeats), and a store with a scripted result. */
function createWorld(answers: Answer[], storeResult: 'purchased' | 'cancelled' | Error = 'purchased') {
  const world = {
    refreshCalls: 0,
    waits: [] as number[],
    receiptsResent: 0,
    storeCalls: 0,
    balances: [] as number[],
    credited: [] as number[],
  };
  const ports: PurchasePorts = {
    buyInStore: async () => {
      world.storeCalls += 1;
      if (storeResult instanceof Error) throw storeResult;
      return storeResult;
    },
    refresh: async () => {
      const answer = answers[Math.min(world.refreshCalls, answers.length - 1)];
      world.refreshCalls += 1;
      if (answer instanceof Error) throw answer;
      return answer;
    },
    resendReceipts: async () => {
      world.receiptsResent += 1;
    },
    applyBalance: (units) => world.balances.push(units),
    afterCredited: (units) => world.credited.push(units),
    wait: async (ms) => {
      world.waits.push(ms);
    },
  };
  return { world, ports };
}

const nothingNew = (balanceUnits: number): PurchaseSync => ({ creditedUnits: 0, creditedPurchaseCount: 0, balanceUnits });
const credited = (units: number, balanceUnits: number): PurchaseSync => ({ creditedUnits: units, creditedPurchaseCount: 1, balanceUnits });

describe('confirming a purchase with the server', () => {
  it('stops at the first answer that shows the credits', async () => {
    const { world, ports } = createWorld([credited(1_120, 1_688)]);
    expect(await confirmPurchase(568, ports)).toEqual({ kind: 'credited', addedUnits: 1_120, balanceUnits: 1_688 });
    expect(world.refreshCalls).toBe(1);
    expect(world.waits).toEqual([]);
  });

  it('asks again while the store confirms, with longer waits, resending receipts once', async () => {
    const { world, ports } = createWorld([nothingNew(568), nothingNew(568), credited(1_120, 1_688)]);
    expect(await confirmPurchase(568, ports)).toMatchObject({ kind: 'credited', balanceUnits: 1_688 });
    expect(world.refreshCalls).toBe(3);
    expect(world.waits).toEqual([1_000, 2_000]);
    expect(world.receiptsResent).toBe(1);
  });

  it('keeps asking through offline, busy and rate-limit answers, because the person has paid', async () => {
    const { world, ports } = createWorld([new OfflineError(), new ApiError(503, 'store_unavailable', 'busy'), new ApiError(429, 'too_many_requests', 'slow'), credited(1_120, 1_688)]);
    expect(await confirmPurchase(568, ports)).toMatchObject({ kind: 'credited' });
    expect(world.refreshCalls).toBe(4);
  });

  it('gives up as pending, never as an error, after the last ask', async () => {
    const { world, ports } = createWorld([nothingNew(568)]);
    expect(await confirmPurchase(568, ports)).toEqual({ kind: 'pending', balanceUnits: 568 });
    expect(world.refreshCalls).toBe(CONFIRM_DELAYS_MS.length + 1);
    expect(world.waits).toEqual([...CONFIRM_DELAYS_MS]);
    const failing = createWorld([new OfflineError()]);
    expect(await confirmPurchase(568, failing.ports)).toEqual({ kind: 'pending', balanceUnits: null });
  });

  it('counts a balance that rose as credited even when the webhook got there first (nothing new for the refresh)', async () => {
    const { ports } = createWorld([nothingNew(1_688)]);
    expect(await confirmPurchase(568, ports)).toEqual({ kind: 'credited', addedUnits: 1_120, balanceUnits: 1_688 });
  });

  it('stops asking when the screen is gone', async () => {
    const { world, ports } = createWorld([nothingNew(568)]);
    const controller = new AbortController();
    controller.abort();
    expect(await confirmPurchase(568, ports, { signal: controller.signal })).toEqual({ kind: 'pending', balanceUnits: null });
    expect(world.refreshCalls).toBe(0);
  });
});

describe('buying a pack', () => {
  it('asks the server first, pays in the store, then takes the credits from the server', async () => {
    const { world, ports } = createWorld([nothingNew(568), credited(1_120, 1_688)]);
    expect(await runPurchase(PACK, ports)).toEqual({ kind: 'credited', addedUnits: 1_120, balanceUnits: 1_688 });
    expect(world.storeCalls).toBe(1);
    expect(world.balances).toEqual([568, 1_688]);
    expect(world.credited).toEqual([1_688]);
  });

  it('buys nothing when the server cannot be reached first', async () => {
    const { world, ports } = createWorld([new OfflineError()]);
    expect(await runPurchase(PACK, ports)).toEqual({ kind: 'offline' });
    expect(world.storeCalls).toBe(0);
    expect(world.balances).toEqual([]);
  });

  it('is cancelled when the person backs out of the store, with no balance change and no alert check', async () => {
    const { world, ports } = createWorld([nothingNew(568)], 'cancelled');
    expect(await runPurchase(PACK, ports)).toEqual({ kind: 'cancelled' });
    expect(world.balances).toEqual([568]);
    expect(world.credited).toEqual([]);
  });

  it('shows the store\'s own words when it cannot take the purchase, and asks the server no more', async () => {
    const { world, ports } = createWorld([nothingNew(568)], new StoreError('Payment declined.'));
    expect(await runPurchase(PACK, ports)).toEqual({ kind: 'failed', message: 'Payment declined.' });
    expect(world.refreshCalls).toBe(1);
  });

  it('ends as pending when paid but the server never shows it, and the balance stays what the server said', async () => {
    const { world, ports } = createWorld([nothingNew(568)]);
    expect(await runPurchase(PACK, ports)).toEqual({ kind: 'pending', balanceUnits: 568 });
    expect(world.credited).toEqual([]);
  });

  it('credits a purchase an earlier run left unconfirmed, when buying again starts with the server', async () => {
    const { world, ports } = createWorld([credited(600, 1_168), nothingNew(1_168)], 'cancelled');
    await runPurchase(PACK, ports);
    expect(world.balances[0]).toBe(1_168);
    expect(world.credited).toEqual([1_168]);
  });

  it('re-arms the low-credit alert once a purchase lifts the balance back above its number', async () => {
    // 10 credits (40 units) is the alert's number; the balance was 12 units and the alert had rung.
    const { world, ports } = createWorld([nothingNew(12), credited(1_120, 1_132)]);
    await runPurchase(PACK, ports);
    const alerted = { isAlertOn: true, thresholdUnits: 40, isAlerted: true };
    expect(world.credited).toEqual([1_132]);
    expect(decideLowCreditAlert(alerted, world.credited[0])).toBe('rearm');
    // A purchase that leaves the balance below the number does not re-arm it.
    expect(decideLowCreditAlert(alerted, 20)).toBe('none');
  });
});

describe('checking for purchases at app open', () => {
  it('takes the balance and credits what the server found', async () => {
    const { world, ports } = createWorld([credited(1_120, 1_688)]);
    expect(await settlePurchases(ports)).toMatchObject({ creditedUnits: 1_120 });
    expect(world.balances).toEqual([1_688]);
    expect(world.credited).toEqual([1_688]);
  });

  it('only refreshes the balance when nothing was new, and does nothing offline', async () => {
    const quiet = createWorld([nothingNew(568)]);
    await settlePurchases(quiet.ports);
    expect(quiet.world.balances).toEqual([568]);
    expect(quiet.world.credited).toEqual([]);

    const offline = createWorld([new OfflineError()]);
    expect(await settlePurchases(offline.ports)).toBeNull();
    expect(offline.world.balances).toEqual([]);
  });
});
