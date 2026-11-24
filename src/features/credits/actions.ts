import { getCreditStore, type CreditStore } from '@/api/creditStore';
import { StoreError } from '@/api/errors';
import { refreshPurchases, type CreditProduct, type PurchaseSync } from '@/api/purchases';
import { openDatabase, queueWrite } from '@/db/client';
import { getSettings, saveLowCreditAlerted } from '@/db/repositories/account';
import { showLowCreditNotification } from '@/notifications/lowCreditNotification';
import { decideLowCreditAlert } from './lowCreditAlert';
import { runPurchase, settlePurchases, type PurchaseOutcome } from './purchaseFlow';

/**
 * Called with the balance the server reported after a charge (or a purchase).
 * Rings the alert once when the balance has just gone below the student's
 * number, and re-arms it when the balance is back above. If the phone will not
 * show notifications the alert is not marked as sent, so it can still ring later.
 */
export async function checkLowCredit(balanceUnits: number): Promise<void> {
  const settings = await getSettings(await openDatabase());
  const decision = decideLowCreditAlert(
    { isAlertOn: settings.lowCreditAlertOn, thresholdUnits: settings.lowCreditThresholdUnits, isAlerted: settings.lowCreditAlerted },
    balanceUnits,
  );
  if (decision === 'rearm') {
    await queueWrite((database) => saveLowCreditAlerted(database, false));
  } else if (decision === 'send') {
    const wasShown = await showLowCreditNotification(balanceUnits);
    if (wasShown) await queueWrite((database) => saveLowCreditAlerted(database, true));
  }
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done);
  });

type BalanceHandlers = { onBalance: (balanceUnits: number) => void };

function buildPorts(store: CreditStore | null, onBalance: (balanceUnits: number) => void, accountId: string) {
  return {
    buyInStore: async (product: CreditProduct) => {
      if (!store) throw new StoreError('Buying credits is not available in this version yet.');
      return store.purchase(product, accountId);
    },
    refresh: refreshPurchases,
    resendReceipts: () => store?.resendReceipts() ?? Promise.resolve(),
    applyBalance: onBalance,
    afterCredited: (balanceUnits: number) => {
      void checkLowCredit(balanceUnits).catch((error: unknown) => console.warn('[reviewer] low credit check failed', error));
    },
    wait,
  };
}

/**
 * Buys a pack: the store takes the payment, then the server is asked (with a
 * few retries) until it shows the credits. The balance comes from the server's
 * answers, and the low-credit alert is re-checked once credits arrive.
 */
export function buyCreditPack(product: CreditProduct, accountId: string, handlers: BalanceHandlers & { signal?: AbortSignal }): Promise<PurchaseOutcome> {
  return runPurchase(product, buildPorts(getCreditStore(), handlers.onBalance, accountId), handlers.signal);
}

/** "Check again" and the check at app open: the server looks for purchases it has not credited yet. */
export function settleStorePurchases(accountId: string, handlers: BalanceHandlers): Promise<PurchaseSync | null> {
  return settlePurchases(buildPorts(getCreditStore(), handlers.onBalance, accountId));
}

/** "Check again" after a purchase that had not arrived: the receipts go to the server's source once more first. */
export async function recheckStorePurchases(accountId: string, handlers: BalanceHandlers): Promise<PurchaseSync | null> {
  await getCreditStore()?.resendReceipts();
  return settleStorePurchases(accountId, handlers);
}

const OPEN_CHECK_MIN_GAP_MS = 60_000;
let lastOpenCheckAt = 0;

/**
 * Credits a purchase an earlier run never confirmed (the app was killed
 * mid-purchase), and refreshes the balance. Runs when the app opens or comes
 * back to the front, at most once a minute (the server asks RevenueCat each
 * time, and has a rate limit). Does nothing when this build has no store.
 */
export async function checkPurchasesOnOpen(accountId: string, handlers: BalanceHandlers, now: number = Date.now()): Promise<void> {
  if (!getCreditStore() || now - lastOpenCheckAt < OPEN_CHECK_MIN_GAP_MS) return;
  lastOpenCheckAt = now;
  await settleStorePurchases(accountId, handlers);
}

/** Tells the store who is signed in, so a purchase is attributed to the right account. */
export function syncStoreAccount(accountId: string): Promise<void> {
  return getCreditStore()?.syncUser(accountId) ?? Promise.resolve();
}
