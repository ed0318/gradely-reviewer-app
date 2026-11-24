/**
 * DEV ONLY: the line between the dummy store (which has no screen) and the
 * sheet that mimics the store's own (`DummyStoreSheet`). The store asks, the
 * sheet answers once, and with no sheet on screen the answer is "cancelled".
 */
export type DummyStoreRequest = {
  storeProductId: string;
  credits: number;
  priceCentavos: number;
};

type Pending = { request: DummyStoreRequest; resolve: (isConfirmed: boolean) => void };

let pending: Pending | null = null;
let sheetCount = 0;
const listeners = new Set<() => void>();

const announce = () => {
  for (const listener of listeners) listener();
};

export function requestDummyStoreConfirmation(request: DummyStoreRequest): Promise<boolean> {
  if (sheetCount === 0 || pending) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    pending = { request, resolve };
    announce();
  });
}

/** The sheet's answer. Does nothing when nothing is waiting. */
export function settleDummyStoreRequest(isConfirmed: boolean): void {
  const current = pending;
  if (!current) return;
  pending = null;
  announce();
  current.resolve(isConfirmed);
}

export function getDummyStoreRequest(): DummyStoreRequest | null {
  return pending?.request ?? null;
}

export function subscribeToDummyStoreRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A sheet is on screen and can answer. Returns the remover; the last one to leave cancels anything waiting. */
export function registerDummyStoreSheet(): () => void {
  sheetCount += 1;
  return () => {
    sheetCount -= 1;
    if (sheetCount === 0) settleDummyStoreRequest(false);
  };
}
