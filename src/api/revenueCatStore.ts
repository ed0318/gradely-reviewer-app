import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesStoreProduct } from 'react-native-purchases';
import { StoreError } from './errors';
import type { CreditStore } from './storeTypes';

/**
 * Buying a credit pack from Google Play or the App Store through RevenueCat,
 * set up as gradely-app's `billing.ts` is: configure with the PUBLIC SDK key,
 * log in with the account id as the app user id, buy by store product id.
 *
 * The store takes the payment; this file never decides the result. The server
 * credits the units (`POST /purchases/refresh`, and the RevenueCat webhook).
 */
const configuredKey = Platform.select({
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  default: undefined,
});

/** A public SDK key for this platform. A secret (`sk_`) key is refused, and so is the other store's. */
export function isPublishableStoreKey(key: string | undefined): key is string {
  if (!key) return false;
  if (/^sk_/i.test(key)) return false;
  return /^(goog|appl|test)_/i.test(key);
}

/** The key to configure with, or null when this build has none (purchases are then unavailable). */
export function readRevenueCatKey(): string | null {
  if (!configuredKey) return null;
  if (isPublishableStoreKey(configuredKey)) return configuredKey;
  console.error('[reviewer] the RevenueCat key is not a public SDK key for this platform (goog_… / appl_…). Purchases are switched off.');
  return null;
}

type Sdk = typeof import('react-native-purchases');

/**
 * Loaded when first needed: a development build made before the package was
 * added has no native half, and a top-level import would take the app down at launch.
 */
function loadSdk(): Sdk {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-purchases') as Sdk;
}

function wasCancelled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { userCancelled?: boolean }).userCancelled === true;
}

/** The text of a store failure, for the person; the SDK's own messages are readable ("payment pending", "store not available"). */
function describeStoreFailure(error: unknown): string {
  const message = typeof error === 'object' && error !== null ? (error as { message?: unknown }).message : null;
  return typeof message === 'string' && message ? message : 'The store could not complete the purchase. Try again.';
}

export function createRevenueCatStore(apiKey: string): CreditStore {
  let isConfigured = false;
  let currentUserId: string | null = null;
  // Sign-in and a purchase can land close together; the SDK calls must happen in the order they were asked for.
  let queue: Promise<void> = Promise.resolve();

  const introduce = async (accountId: string): Promise<void> => {
    const { default: Purchases, LOG_LEVEL } = loadSdk();
    if (!isConfigured) {
      // Quiet in a release: the debug log prints the app user id on every call.
      void Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
      Purchases.configure({ apiKey, appUserID: accountId });
      isConfigured = true;
      currentUserId = accountId;
      return;
    }
    if (accountId === currentUserId) return;
    await Purchases.logIn(accountId);
    currentUserId = accountId;
  };

  const syncUser = (accountId: string): Promise<void> => {
    queue = queue.then(() => introduce(accountId)).catch((error: unknown) => console.warn('[reviewer] could not update the store account', error));
    return queue;
  };

  /** Nothing is bought for an account the store is not holding: a payment would land on the wrong person. */
  const requireStoreHolds = async (accountId: string): Promise<void> => {
    await syncUser(accountId);
    const holding = isConfigured ? await loadSdk().default.getAppUserID() : null;
    if (holding !== accountId) throw new StoreError('The store could not be told who is buying. Check your connection, then try again.');
  };

  return {
    kind: 'revenuecat',
    syncUser,
    async purchase(product, accountId) {
      try {
        await requireStoreHolds(accountId);
        const { default: Purchases } = loadSdk();
        const found = await Purchases.getProducts([product.storeProductId], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
        // Google Play can report a product with a base plan after a colon; the bare id is what we asked for.
        const storeProduct: PurchasesStoreProduct | undefined = found.find((candidate) => candidate.identifier.split(':')[0] === product.storeProductId);
        if (!storeProduct) throw new StoreError('That pack is not available in the store yet.');
        await Purchases.purchaseStoreProduct(storeProduct);
        return 'purchased';
      } catch (error) {
        if (wasCancelled(error)) return 'cancelled';
        if (error instanceof StoreError) throw error;
        console.warn('[reviewer] store purchase failed', error);
        throw new StoreError(describeStoreFailure(error));
      }
    },
    async resendReceipts() {
      try {
        await loadSdk().default.syncPurchases();
      } catch (error) {
        console.warn('[reviewer] could not resend the receipts', error);
      }
    },
    subscribeToUpdates(listener) {
      if (!isConfigured) return () => {};
      const { default: Purchases } = loadSdk();
      const onUpdate = (_info: CustomerInfo) => listener();
      Purchases.addCustomerInfoUpdateListener(onUpdate);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(onUpdate);
      };
    },
  };
}
