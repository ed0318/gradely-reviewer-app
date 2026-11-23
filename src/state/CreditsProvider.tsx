import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { openDatabase, queueWrite } from '@/db/client';
import { getSettings, saveBalanceCache } from '@/db/repositories/account';

/**
 * The credit balance, in integer units. The server decides it; this holds the
 * last value it reported (cached in SQLite so it shows offline) and is updated
 * from /me, a charge or a purchase.
 */
type CreditsContextValue = {
  /** Null until the cache has been read, or when nothing was ever reported. */
  balanceUnits: number | null;
  applyServerBalance: (balanceUnits: number) => void;
  clearBalance: () => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [balanceUnits, setBalanceUnits] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    void openDatabase()
      .then(getSettings)
      .then((settings) => {
        if (isMounted) setBalanceUnits((current) => current ?? settings.balanceUnitsCache);
      })
      .catch((error: unknown) => console.warn('[reviewer] balance cache unreadable', error));
    return () => {
      isMounted = false;
    };
  }, []);

  const applyServerBalance = useCallback((units: number) => {
    setBalanceUnits(units);
    void queueWrite((database) => saveBalanceCache(database, units, Date.now())).catch((error: unknown) =>
      console.warn('[reviewer] balance cache not saved', error),
    );
  }, []);

  const clearBalance = useCallback(() => setBalanceUnits(null), []);

  const value = useMemo(() => ({ balanceUnits, applyServerBalance, clearBalance }), [balanceUnits, applyServerBalance, clearBalance]);
  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(): CreditsContextValue {
  const value = useContext(CreditsContext);
  if (!value) throw new Error('useCredits must be used inside CreditsProvider.');
  return value;
}
