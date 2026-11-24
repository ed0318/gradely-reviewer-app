import { ApiError, OfflineError, StoreError, isRequestCancelled } from '@/api/errors';
import type { CreditProduct, PurchaseSync } from '@/api/purchases';
import type { StorePurchaseResult } from '@/api/storeTypes';

/**
 * Buying a pack, step by step, with the world passed in (`PurchasePorts`) so
 * the rules are tested without a store or a server.
 *
 * 1. Ask the server first. It tells us we are online, credits any purchase an
 *    earlier run left unconfirmed (killed mid-purchase), and gives the balance
 *    to compare with afterwards. Offline: nothing is bought.
 * 2. The store takes the payment.
 * 3. Ask the server again, a few times, while the store and RevenueCat catch
 *    up. Whatever goes wrong here, the person has paid: it ends as `pending`
 *    (never as a failure), and the next refresh credits it.
 *
 * The balance only ever comes from the server's answers.
 */
export type PurchasePorts = {
  buyInStore: (product: CreditProduct) => Promise<StorePurchaseResult>;
  refresh: () => Promise<PurchaseSync>;
  resendReceipts: () => Promise<void>;
  /** The server's balance, to show. */
  applyBalance: (balanceUnits: number) => void;
  /** Credits just arrived: the low-credit alert re-arms when the balance is back above its number. */
  afterCredited: (balanceUnits: number) => void;
  wait: (ms: number, signal?: AbortSignal) => Promise<void>;
};

/** Six asks in about 15 seconds: RevenueCat's read of a purchase can lag by several seconds. */
export const CONFIRM_DELAYS_MS = [1_000, 2_000, 3_000, 4_000, 5_000] as const;

export type PurchaseConfirmation = { kind: 'credited'; addedUnits: number; balanceUnits: number } | { kind: 'pending'; balanceUnits: number | null };

export type PurchaseOutcome =
  | PurchaseConfirmation
  | { kind: 'cancelled' }
  /** The server could not be reached before paying: nothing was bought. */
  | { kind: 'offline' }
  | { kind: 'failed'; message: string };

const WRONG_ANSWER = 'Something went wrong. Nothing was bought. Try again.';

/**
 * Asks the server until it shows the purchase: units credited in this answer,
 * or a balance above what it was (the webhook can credit first, and the refresh
 * then has nothing new to add). Never throws; running out of asks, or being
 * aborted, is `pending`.
 */
export async function confirmPurchase(
  balanceBeforeUnits: number,
  ports: Pick<PurchasePorts, 'refresh' | 'resendReceipts' | 'wait'>,
  options: { delaysMs?: readonly number[]; signal?: AbortSignal } = {},
): Promise<PurchaseConfirmation> {
  const delaysMs = options.delaysMs ?? CONFIRM_DELAYS_MS;
  let latestBalance: number | null = null;
  for (let attempt = 0; attempt <= delaysMs.length; attempt += 1) {
    if (options.signal?.aborted) break;
    try {
      const sync = await ports.refresh();
      latestBalance = sync.balanceUnits;
      if (sync.creditedUnits > 0 || sync.balanceUnits > balanceBeforeUnits) {
        return { kind: 'credited', addedUnits: Math.max(sync.creditedUnits, sync.balanceUnits - balanceBeforeUnits), balanceUnits: sync.balanceUnits };
      }
    } catch (error) {
      if (isRequestCancelled(error)) break;
      // Offline, a 503, the rate limit: the person has paid, so wait it out like a "not yet".
    }
    if (attempt === delaysMs.length) break;
    // Once, before the second ask, the store's receipts go to RevenueCat again.
    if (attempt === 0) await ports.resendReceipts();
    await ports.wait(delaysMs[attempt], options.signal);
  }
  return { kind: 'pending', balanceUnits: latestBalance };
}

export async function runPurchase(product: CreditProduct, ports: PurchasePorts, signal?: AbortSignal): Promise<PurchaseOutcome> {
  let balanceBeforeUnits: number;
  try {
    const first = await ports.refresh();
    balanceBeforeUnits = first.balanceUnits;
    ports.applyBalance(first.balanceUnits);
    if (first.creditedUnits > 0) ports.afterCredited(first.balanceUnits);
  } catch (error) {
    if (isRequestCancelled(error)) return { kind: 'cancelled' };
    if (error instanceof OfflineError) return { kind: 'offline' };
    if (error instanceof ApiError && error.status >= 500) return { kind: 'failed', message: 'The credits server is busy. Nothing was bought. Try again in a moment.' };
    return { kind: 'failed', message: WRONG_ANSWER };
  }

  let storeResult: StorePurchaseResult;
  try {
    storeResult = await ports.buyInStore(product);
  } catch (error) {
    return { kind: 'failed', message: error instanceof StoreError ? error.message : WRONG_ANSWER };
  }
  if (storeResult === 'cancelled') return { kind: 'cancelled' };

  const confirmation = await confirmPurchase(balanceBeforeUnits, ports, { signal });
  if (confirmation.balanceUnits !== null) ports.applyBalance(confirmation.balanceUnits);
  if (confirmation.kind === 'credited') ports.afterCredited(confirmation.balanceUnits);
  return confirmation;
}

/**
 * "Check again" after a purchase that had not arrived, and the check at every
 * app open: the server asks the store once and credits anything new. Null when
 * the server could not be reached (nothing changes).
 */
export async function settlePurchases(ports: Pick<PurchasePorts, 'refresh' | 'applyBalance' | 'afterCredited'>): Promise<PurchaseSync | null> {
  try {
    const sync = await ports.refresh();
    ports.applyBalance(sync.balanceUnits);
    if (sync.creditedUnits > 0) ports.afterCredited(sync.balanceUnits);
    return sync;
  } catch {
    return null;
  }
}
