import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { reconcileExamReminders, retryPendingCharges } from '../actions';
import { setUpNotificationChannels } from '@/notifications/notificationChannels';
import { showNotificationsWhileOpen } from '@/notifications/notificationHandler';
import { useCredits } from '@/state/CreditsProvider';

const FIRST_RUN_DELAY_MS = 1200;

/**
 * What the exams need from the app each time it opens or comes back to the
 * front, once signed in: settle any charge left `charging` (same key, so never
 * charged twice), make sure every scheduled exam's reminder is on the phone, and
 * open the exam when its reminder is tapped. The first run waits a moment, so
 * it never competes with the first paint.
 */
export function useExamHousekeeping(): void {
  const { applyServerBalance } = useCredits();

  useEffect(() => {
    showNotificationsWhileOpen();
    void setUpNotificationChannels();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isRunning = false;
    const run = () => {
      if (isRunning) return;
      isRunning = true;
      void (async () => {
        await retryPendingCharges({ onBalance: applyServerBalance, signal: controller.signal });
        await reconcileExamReminders();
      })()
        .catch((error: unknown) => console.warn('[reviewer] exam housekeeping failed', error))
        .finally(() => {
          isRunning = false;
        });
    };
    const firstRun = setTimeout(run, FIRST_RUN_DELAY_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      clearTimeout(firstRun);
      controller.abort();
      subscription.remove();
    };
  }, [applyServerBalance]);

  const lastResponse = Notifications.useLastNotificationResponse();
  const openedResponseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lastResponse) return;
    const request = lastResponse.notification.request;
    const data = request.content.data as { kind?: string; attemptId?: string } | undefined;
    if (data?.kind !== 'exam-reminder' || typeof data.attemptId !== 'string') return;
    if (openedResponseRef.current === request.identifier) return;
    openedResponseRef.current = request.identifier;
    router.push({ pathname: '/exam/[id]/take', params: { id: data.attemptId } });
  }, [lastResponse]);
}
