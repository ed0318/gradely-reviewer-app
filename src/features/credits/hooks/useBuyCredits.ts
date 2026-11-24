import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getCreditStore } from '@/api/creditStore';
import { isOfflineError, isRequestCancelled } from '@/api/errors';
import { listProducts, type CreditProduct } from '@/api/purchases';
import { useSignedInSession } from '@/state/AccountProvider';
import { useCredits } from '@/state/CreditsProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { buyCreditPack, recheckStorePurchases, settleStorePurchases } from '../actions';
import { cleanItemsText, countItemsInPack, DEFAULT_CALCULATOR_ITEMS, describeItemsAsCredits, parseItemsText, stepItems } from '../creditCalculator';

export type ProductsStatus = 'loading' | 'ready' | 'offline' | 'error';

/** What the screen says about the purchase in hand. */
export type PurchaseView =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'credited'; addedUnits: number }
  /** Paid; the server has not shown the credits yet. Nothing is lost: the next check credits it. */
  | { kind: 'pending'; isChecking: boolean }
  | { kind: 'offline' }
  | { kind: 'failed'; message: string };

/** The pack the mockup marks "Best value". */
export const BEST_VALUE_STORE_PRODUCT_ID = 'reviewer_credits_280';

/**
 * Buy credits (mockup 9): the packs from the server, the chosen one, the
 * items → credits calculator, and the purchase itself. The balance only ever
 * changes from the server's answers (`applyServerBalance`).
 */
export function useBuyCredits() {
  const { account } = useSignedInSession();
  const { balanceUnits, applyServerBalance } = useCredits();
  const isMountedRef = useIsMountedRef();
  const [productsStatus, setProductsStatus] = useState<ProductsStatus>('loading');
  const [products, setProducts] = useState<CreditProduct[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [itemsText, setItemsText] = useState(String(DEFAULT_CALCULATOR_ITEMS));
  const [purchase, setPurchase] = useState<PurchaseView>({ kind: 'idle' });
  const [loadKey, setLoadKey] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const balanceAtStartRef = useRef<number | null>(null);
  const store = getCreditStore();

  useEffect(() => {
    const controller = new AbortController();
    listProducts(controller.signal)
      .then((list) => {
        setProducts(list);
        setPickedId((current) => current ?? (list.find((product) => product.storeProductId === BEST_VALUE_STORE_PRODUCT_ID) ?? list[0])?.storeProductId ?? null);
        setProductsStatus('ready');
      })
      .catch((error: unknown) => {
        if (isRequestCancelled(error)) return;
        setProductsStatus(isOfflineError(error) ? 'offline' : 'error');
      });
    return () => controller.abort();
  }, [loadKey]);

  // Back on this tab with no packs (it opened offline): ask again.
  // Read through a ref: reacting to the status itself would retry in a loop while the phone stays offline.
  const productsStatusRef = useRef(productsStatus);
  useEffect(() => {
    productsStatusRef.current = productsStatus;
  });
  useFocusEffect(
    useCallback(() => {
      if (productsStatusRef.current === 'offline' || productsStatusRef.current === 'error') setLoadKey((key) => key + 1);
    }, []),
  );

  // A purchase can finish outside this screen (Ask to Buy approved, a payment that was pending): the store says so, and the server is asked.
  const accountId = account.id;
  const isWorkingRef = useRef(false);
  useEffect(() => {
    isWorkingRef.current = purchase.kind === 'working';
  });
  useEffect(() => {
    if (!store) return;
    let isActive = true;
    let removeListener: (() => void) | null = null;
    void store.syncUser(accountId).then(() => {
      if (!isActive) return;
      removeListener = store.subscribeToUpdates(() => {
        if (!isWorkingRef.current) void settleStorePurchases(accountId, { onBalance: applyServerBalance });
      });
    });
    return () => {
      isActive = false;
      removeListener?.();
    };
  }, [store, accountId, applyServerBalance]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const chosen = useMemo(() => products.find((product) => product.storeProductId === pickedId) ?? null, [products, pickedId]);
  const items = parseItemsText(itemsText);

  const buy = useCallback(async () => {
    if (!chosen || purchase.kind === 'working') return;
    const controller = new AbortController();
    controllerRef.current = controller;
    balanceAtStartRef.current = balanceUnits;
    setPurchase({ kind: 'working' });
    const outcome = await buyCreditPack(chosen, accountId, { onBalance: applyServerBalance, signal: controller.signal });
    if (!isMountedRef.current) return;
    switch (outcome.kind) {
      case 'credited':
        setPurchase({ kind: 'credited', addedUnits: outcome.addedUnits });
        return;
      case 'pending':
        setPurchase({ kind: 'pending', isChecking: false });
        return;
      case 'cancelled':
        setPurchase({ kind: 'idle' });
        return;
      case 'offline':
        setPurchase({ kind: 'offline' });
        return;
      case 'failed':
        setPurchase({ kind: 'failed', message: outcome.message });
    }
  }, [chosen, purchase.kind, balanceUnits, accountId, applyServerBalance, isMountedRef]);

  const checkAgain = useCallback(async () => {
    setPurchase({ kind: 'pending', isChecking: true });
    const sync = await recheckStorePurchases(accountId, { onBalance: applyServerBalance });
    if (!isMountedRef.current) return;
    const before = balanceAtStartRef.current;
    const addedUnits = sync ? Math.max(sync.creditedUnits, before === null ? 0 : sync.balanceUnits - before) : 0;
    setPurchase(addedUnits > 0 ? { kind: 'credited', addedUnits } : { kind: 'pending', isChecking: false });
  }, [accountId, applyServerBalance, isMountedRef]);

  return {
    store,
    productsStatus,
    products,
    chosen,
    pickedId,
    balanceUnits,
    purchase,
    itemsText,
    items,
    creditsForItems: describeItemsAsCredits(items),
    itemsInChosenPack: chosen ? countItemsInPack(chosen.units) : 0,
    pickProduct: setPickedId,
    changeItemsText: useCallback((text: string) => setItemsText(cleanItemsText(text)), []),
    stepItemsBy: useCallback((direction: 1 | -1) => setItemsText((text) => String(stepItems(parseItemsText(text) || 0, direction))), []),
    retryProducts: useCallback(() => {
      setProductsStatus('loading');
      setLoadKey((key) => key + 1);
    }, []),
    buy,
    checkAgain,
    dismissResult: useCallback(() => setPurchase({ kind: 'idle' }), []),
  };
}
