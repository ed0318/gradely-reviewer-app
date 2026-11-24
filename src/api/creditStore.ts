import { isApiMocked } from './config';
import { dummyCreditStore, isDummyStoreAvailable } from './mock/mockCreditStore';
import { createRevenueCatStore, readRevenueCatKey } from './revenueCatStore';
import type { CreditStore } from './storeTypes';

export type { CreditStore, StorePurchaseResult } from './storeTypes';

let chosenStore: CreditStore | null | undefined;

/**
 * The store this build buys from, or null when it has none (no RevenueCat key,
 * or a release build with the dummy API on, which never sells anything).
 *
 * With the dummy API on in a development build it is the dummy store, whatever
 * keys are set: the dummy server cannot see a real store's purchases.
 */
export function getCreditStore(): CreditStore | null {
  if (chosenStore !== undefined) return chosenStore;
  if (isApiMocked) chosenStore = isDummyStoreAvailable ? dummyCreditStore : null;
  else {
    const key = readRevenueCatKey();
    chosenStore = key ? createRevenueCatStore(key) : null;
  }
  return chosenStore;
}
