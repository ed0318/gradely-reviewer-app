/**
 * When the low-credit alert rings. After each charge, if the balance has just
 * gone below the number the student set, one notification; and not again until
 * the balance has gone back to that number or above (a purchase), which
 * re-arms it.
 */

export type LowCreditState = {
  isAlertOn: boolean;
  thresholdUnits: number;
  /** True once the alert has rung and the balance has not been back above the number since. */
  isAlerted: boolean;
};

export type LowCreditDecision = 'send' | 'rearm' | 'none';

export function decideLowCreditAlert(state: LowCreditState, balanceUnits: number): LowCreditDecision {
  const isBelow = balanceUnits < state.thresholdUnits;
  if (!isBelow) return state.isAlerted ? 'rearm' : 'none';
  if (!state.isAlertOn || state.isAlerted) return 'none';
  return 'send';
}
