import { isApiMocked } from '../config';
import { StoreError } from '../errors';
import type { CreditStore } from '../storeTypes';
import { recordMockStorePurchase } from './mockServer';
import { requestDummyStoreConfirmation } from './mockStoreSheetBridge';
import { runOnMockServer } from './mockTransport';

/**
 * DEV ONLY: a fake store that "buys" without a store, so the whole purchase
 * flow can be tried before real products exist.
 *
 * It is on only when the dummy API is on (EXPO_PUBLIC_API_MOCK=1) in a
 * development build (`__DEV__`). A release build refuses the mock altogether
 * (app.config.js), and if one ever ran with it the store below throws instead
 * of selling anything. "Buying" shows a sheet that mimics the store's (Buy or
 * Cancel), waits a moment, then writes a pending purchase with a fake store
 * transaction id into the dummy server; the credits arrive when the app asks
 * /purchases/refresh, once per transaction id, as with the real server.
 */
export const isDummyStoreAvailable = isApiMocked && typeof __DEV__ !== 'undefined' && __DEV__;

/** How long the fake store "takes the payment" after Buy. */
export const DUMMY_STORE_DELAY_MS = 900;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const dummyCreditStore: CreditStore = {
  kind: 'dummy',
  syncUser: async () => {},
  async purchase(product, accountId) {
    if (!isDummyStoreAvailable) throw new StoreError('The dummy store only exists in development builds.');
    const isConfirmed = await requestDummyStoreConfirmation({
      storeProductId: product.storeProductId,
      credits: product.credits,
      priceCentavos: product.priceCentavos,
    });
    if (!isConfirmed) return 'cancelled';
    await wait(DUMMY_STORE_DELAY_MS);
    const recorded = runOnMockServer((context) => recordMockStorePurchase(context, accountId, product.storeProductId, `dummy-store-${context.createId()}`));
    if (!recorded) throw new StoreError('The dummy store does not sell that pack.');
    return 'purchased';
  },
  resendReceipts: async () => {},
  subscribeToUpdates: () => () => {},
};
