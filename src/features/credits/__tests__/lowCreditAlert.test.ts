import { describe, expect, it } from 'vitest';
import { decideLowCreditAlert, type LowCreditState } from '../lowCreditAlert';

const ARMED: LowCreditState = { isAlertOn: true, thresholdUnits: 40, isAlerted: false };

describe('the low-credit alert', () => {
  it('rings once when a charge takes the balance below the number', () => {
    expect(decideLowCreditAlert(ARMED, 39)).toBe('send');
  });

  it('does not ring at the number itself or above it', () => {
    expect(decideLowCreditAlert(ARMED, 40)).toBe('none');
    expect(decideLowCreditAlert(ARMED, 400)).toBe('none');
  });

  it('does not ring again while the balance stays below', () => {
    expect(decideLowCreditAlert({ ...ARMED, isAlerted: true }, 30)).toBe('none');
  });

  it('re-arms once the balance is back at the number or above, then rings again below', () => {
    const alerted = { ...ARMED, isAlerted: true };
    expect(decideLowCreditAlert(alerted, 40)).toBe('rearm');
    expect(decideLowCreditAlert({ ...alerted, isAlerted: false }, 10)).toBe('send');
  });

  it('stays quiet when switched off', () => {
    expect(decideLowCreditAlert({ ...ARMED, isAlertOn: false }, 1)).toBe('none');
  });
});
