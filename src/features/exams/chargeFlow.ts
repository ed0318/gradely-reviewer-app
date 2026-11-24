import { ApiError, OfflineError, RequestCancelledError, type ApiErrorCode } from '@/api/errors';

/**
 * The charge flow's state machine, with no database, network or screen in it.
 *
 * An attempt is saved as `charging` first, carrying its idempotency key. This
 * module then asks the server to charge under that key and decides what the
 * answer means:
 *
 * - charged: take the balance, copy the questions in, the attempt is ready.
 * - 402: nothing was charged. Drop the local attempt.
 * - no answer (offline, timeout, a server error): the server may or may not
 *   have charged, so the attempt stays `charging`. Running it again later sends
 *   the SAME key, and the server answers with its first result instead of
 *   charging twice.
 *
 * The ports are what touches the world; tests give it fakes.
 */

export type PendingCharge = {
  attemptId: string;
  /** The idempotency key: made once, saved with the attempt, reused on every retry. */
  chargeId: string;
  examName: string;
  itemCount: number;
};

export type ChargePorts = {
  requestCharge: (charge: { idempotencyKey: string; examName: string; itemCount: number }) => Promise<{ balanceUnits: number }>;
  /** Called with the server's balance as soon as it says it charged, before anything else can fail. */
  applyBalance: (balanceUnits: number) => void;
  /** Picks the questions, copies them in and marks the attempt ready or scheduled. `source_missing`: nothing left to pick from. */
  buildAttempt: (attemptId: string) => Promise<'built' | 'already_built' | 'source_missing'>;
  /** Deletes the attempt (and its exam, if it was the exam's only one). */
  discardAttempt: (attemptId: string) => Promise<void>;
};

export type ChargeOutcome =
  | { kind: 'ready'; attemptId: string; balanceUnits: number }
  /** The server charged, but the topic has nothing left to build the exam from. */
  | { kind: 'source_missing'; balanceUnits: number }
  | { kind: 'insufficient_credits' }
  /** The server refused the request for good; the attempt was dropped. */
  | { kind: 'rejected'; code: ApiErrorCode }
  /** No answer: the attempt is kept and will be tried again with the same key. */
  | { kind: 'offline' }
  /** The server answered with trouble of its own: kept and tried again the same way. */
  | { kind: 'unavailable' }
  | { kind: 'cancelled' };

/** Codes that mean the server looked at this request and will never accept it. */
const REFUSED_FOR_GOOD: readonly ApiErrorCode[] = ['validation_failed', 'idempotency_key_reused', 'forbidden', 'not_found', 'method_not_allowed'];

export async function settleCharge(pending: PendingCharge, ports: ChargePorts): Promise<ChargeOutcome> {
  let balanceUnits: number;
  try {
    ({ balanceUnits } = await ports.requestCharge({ idempotencyKey: pending.chargeId, examName: pending.examName, itemCount: pending.itemCount }));
  } catch (error) {
    return interpretChargeFailure(error, pending, ports);
  }

  ports.applyBalance(balanceUnits);
  const built = await ports.buildAttempt(pending.attemptId);
  if (built === 'source_missing') {
    await ports.discardAttempt(pending.attemptId);
    return { kind: 'source_missing', balanceUnits };
  }
  return { kind: 'ready', attemptId: pending.attemptId, balanceUnits };
}

async function interpretChargeFailure(error: unknown, pending: PendingCharge, ports: ChargePorts): Promise<ChargeOutcome> {
  if (error instanceof RequestCancelledError) return { kind: 'cancelled' };
  if (error instanceof OfflineError) return { kind: 'offline' };
  if (error instanceof ApiError) {
    if (error.code === 'insufficient_credits') {
      await ports.discardAttempt(pending.attemptId);
      return { kind: 'insufficient_credits' };
    }
    if (REFUSED_FOR_GOOD.includes(error.code)) {
      await ports.discardAttempt(pending.attemptId);
      return { kind: 'rejected', code: error.code };
    }
    return { kind: 'unavailable' };
  }
  throw error;
}

/** True when the attempt is still waiting and a later run should try it again. */
export function isChargeStillPending(outcome: ChargeOutcome): boolean {
  return outcome.kind === 'offline' || outcome.kind === 'unavailable' || outcome.kind === 'cancelled';
}
