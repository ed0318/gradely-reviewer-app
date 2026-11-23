import { requestList, requestResult } from './client';

/** A credit pack. Units and the peso price come from the server, never from the app. */
export type CreditProduct = {
  id: number;
  storeProductId: string;
  credits: number;
  units: number;
  priceCentavos: number;
};

type CreditProductPayload = { id: number; store_product_id: string; credits: number; units: number; price_centavos: number };

export async function listProducts(signal?: AbortSignal): Promise<CreditProduct[]> {
  const { results } = await requestList<CreditProductPayload>('/products', { isPublic: true, signal });
  return results.map((product) => ({
    id: product.id,
    storeProductId: product.store_product_id,
    credits: product.credits,
    units: product.units,
    priceCentavos: product.price_centavos,
  }));
}

export type PurchaseSync = { creditedUnits: number; creditedPurchaseCount: number; balanceUnits: number };

/**
 * After a purchase or restore: the server asks RevenueCat what this account
 * bought and credits anything new, once per store transaction.
 */
export async function refreshPurchases(): Promise<PurchaseSync> {
  const payload = await requestResult<{ credited_units: number; credited_purchase_count: number; balance_units: number }>('/purchases/refresh', {
    method: 'POST',
  });
  return {
    creditedUnits: payload.credited_units,
    creditedPurchaseCount: payload.credited_purchase_count,
    balanceUnits: payload.balance_units,
  };
}
