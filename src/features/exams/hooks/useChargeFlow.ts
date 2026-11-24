import { useCallback, useEffect, useRef, useState } from 'react';
import { runCharge } from '../actions';
import type { PendingCharge } from '../chargeFlow';
import { calculateExamCostUnits } from '@/lib/creditUnits';
import { useCredits } from '@/state/CreditsProvider';
import { useIsMountedRef } from '@/state/useIsMountedRef';

export type ChargeFlowState =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'insufficient'; itemCount: number; neededUnits: number }
  /** No answer from the server: the attempt waits, and Try again sends the same key. */
  | { kind: 'offline'; pending: PendingCharge; reason: 'offline' | 'unavailable'; isRetrying: boolean }
  | { kind: 'failed'; title: string; message: string };

const FAILED_UNEXPECTEDLY: ChargeFlowState = { kind: 'failed', title: 'Something went wrong', message: "Couldn't make the exam. Nothing was charged. Try again." };

/**
 * What the screen shows while an exam or a retake is being charged for and
 * made: working, the Not enough credits sheet, the offline sheet, or a failure.
 * The rules themselves are in `chargeFlow.ts`; this only turns them into state.
 * `begin` takes a function that saves the attempt as `charging` (step 1), so the
 * same hook serves a new exam and a retake.
 */
export function useChargeFlow(onReady: (attemptId: string) => void) {
  const { applyServerBalance } = useCredits();
  const [state, setState] = useState<ChargeFlowState>({ kind: 'idle' });
  const isMountedRef = useIsMountedRef();
  const controllerRef = useRef<AbortController | null>(null);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  // Leaving the screen drops the request; the attempt stays `charging` and is settled the next time the app opens.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const settle = useCallback(
    async (pending: PendingCharge) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      const outcome = await runCharge(pending, { onBalance: applyServerBalance, signal: controller.signal });
      if (!isMountedRef.current) return;
      switch (outcome.kind) {
        case 'ready':
          setState({ kind: 'idle' });
          onReadyRef.current(outcome.attemptId);
          return;
        case 'insufficient_credits':
          setState({ kind: 'insufficient', itemCount: pending.itemCount, neededUnits: calculateExamCostUnits(pending.itemCount) });
          return;
        case 'offline':
        case 'unavailable':
          setState({ kind: 'offline', pending, reason: outcome.kind, isRetrying: false });
          return;
        case 'rejected':
          setState({ kind: 'failed', title: "The server couldn't take this exam", message: 'Nothing was charged. Check the exam details and try again.' });
          return;
        case 'source_missing':
          setState({ kind: 'failed', title: 'The topic has no questions left', message: 'The credits for this exam were used, but there is nothing left in the topic to build it from.' });
          return;
        case 'cancelled':
          setState({ kind: 'idle' });
      }
    },
    [applyServerBalance, isMountedRef],
  );

  const begin = useCallback(
    async (savePending: () => Promise<PendingCharge | null>) => {
      setState({ kind: 'working' });
      try {
        const pending = await savePending();
        if (!isMountedRef.current) return;
        if (!pending) {
          setState({ kind: 'failed', title: 'Nothing to retake', message: 'That exam has no questions to retake.' });
          return;
        }
        await settle(pending);
      } catch (error) {
        console.warn('[reviewer] exam not made', error);
        if (isMountedRef.current) setState(FAILED_UNEXPECTEDLY);
      }
    },
    [isMountedRef, settle],
  );

  const retry = useCallback(async () => {
    if (state.kind !== 'offline') return;
    setState({ ...state, isRetrying: true });
    try {
      await settle(state.pending);
    } catch (error) {
      console.warn('[reviewer] charge not retried', error);
      if (isMountedRef.current) setState(FAILED_UNEXPECTEDLY);
    }
  }, [isMountedRef, settle, state]);

  const dismiss = useCallback(() => setState({ kind: 'idle' }), []);

  return { state, isBusy: state.kind === 'working' || (state.kind === 'offline' && state.isRetrying), begin, retry, dismiss };
}
