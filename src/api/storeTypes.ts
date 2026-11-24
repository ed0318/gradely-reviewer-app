import type { CreditProduct } from './purchases';

/** How a store purchase ended, as far as the store can tell. The server decides whether credits arrive. */
export type StorePurchaseResult = 'purchased' | 'cancelled';

/**
 * Whatever takes the payment: Google Play or the App Store through RevenueCat,
 * or the dev dummy store. Throws `StoreError` when the store cannot take it.
 */
export type CreditStore = {
  kind: 'revenuecat' | 'dummy';
  /** Tells the store who is buying (RevenueCat's app user id is the account id). */
  syncUser: (accountId: string) => Promise<void>;
  /** Buys one pack for the account; resolves once the store is done. */
  purchase: (product: CreditProduct, accountId: string) => Promise<StorePurchaseResult>;
  /** Hands the store's receipts to the server's source again (RevenueCat), for a purchase that has not arrived. */
  resendReceipts: () => Promise<void>;
  /** The store says something changed (an Ask-to-Buy approval, a purchase finished late). Returns the remover. */
  subscribeToUpdates: (listener: () => void) => () => void;
};
