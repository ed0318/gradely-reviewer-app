import { useEffect, useState } from 'react';
import { openDatabase, queueWrite } from '@/db/client';
import { getSettings, saveLowCreditAlertSettings } from '@/db/repositories/account';
import { UNITS_PER_CREDIT } from '@/lib/creditUnits';

/**
 * The low-credit alert's switch and threshold. The threshold is typed in whole
 * credits and stored as units. Sending the alert itself comes with Phase 8.
 */
export function useLowCreditAlert() {
  const [isOn, setIsOn] = useState(true);
  const [thresholdText, setThresholdText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void openDatabase()
      .then(getSettings)
      .then((settings) => {
        if (!isMounted) return;
        setIsOn(settings.lowCreditAlertOn);
        setThresholdText(String(Math.floor(settings.lowCreditThresholdUnits / UNITS_PER_CREDIT)));
        setIsLoaded(true);
      })
      .catch((error: unknown) => console.warn('[reviewer] alert settings unreadable', error));
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = (nextIsOn: boolean, nextThresholdText: string) => {
    const credits = Number.parseInt(nextThresholdText, 10);
    if (!Number.isFinite(credits) || credits < 0) return;
    void queueWrite((database) =>
      saveLowCreditAlertSettings(database, { lowCreditAlertOn: nextIsOn, lowCreditThresholdUnits: credits * UNITS_PER_CREDIT }),
    ).catch((error: unknown) => console.warn('[reviewer] alert settings not saved', error));
  };

  return {
    isLoaded,
    isOn,
    thresholdText,
    toggle: (nextIsOn: boolean) => {
      setIsOn(nextIsOn);
      persist(nextIsOn, thresholdText);
    },
    setThresholdText: (value: string) => setThresholdText(value.replace(/\D/g, '').slice(0, 4)),
    saveThreshold: () => persist(isOn, thresholdText),
    /** From the editor dialog: whole credits, typed. */
    saveThresholdText: (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 4) || '0';
      setThresholdText(digits);
      persist(isOn, digits);
    },
  };
}
