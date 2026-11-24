import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { savePendingExam } from '../actions';
import { countAffordableItems } from '../examDraft';
import { useChargeFlow } from './useChargeFlow';
import { useExamForm } from './useExamForm';
import { useExamTopic, type ExamTopic } from './useExamTopic';
import { useReminderPermission } from './useReminderPermission';
import { useCredits } from '@/state/CreditsProvider';

/** Everything the Create exam screen shows and does: the form, the topic, the charge flow and the reminder permission. */
export function useCreateExam(initialTopicId: string | undefined) {
  const form = useExamForm();
  const { applyTopic } = form;
  const topic = useExamTopic(initialTopicId, applyTopic);
  const reminderPermission = useReminderPermission();
  const { balanceUnits } = useCredits();
  const [problem, setProblem] = useState<string | null>(null);
  const isScheduling = form.isScheduled;

  const flow = useChargeFlow(
    useCallback(
      (attemptId: string) => {
        // A scheduled exam goes back to where the student was; one started now opens straight away.
        if (isScheduling) {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)');
        } else router.replace({ pathname: '/exam/[id]/take', params: { id: attemptId } });
      },
      [isScheduling],
    ),
  );
  const { begin } = flow;
  const { buildPlan, findProblem } = form;

  const submit = useCallback(
    (itemCountOverride?: number) => {
      const now = Date.now();
      const plan = buildPlan(now, itemCountOverride);
      if (!plan) {
        setProblem(findProblem(now) ?? 'Check the exam details.');
        return;
      }
      setProblem(null);
      void begin(() => savePendingExam(plan));
    },
    [begin, buildPlan, findProblem],
  );

  const handleSubmit = useCallback(() => submit(), [submit]);

  /** "Make it N items instead": the most the balance pays for, made right away. */
  const affordableItems = balanceUnits === null ? 0 : Math.min(countAffordableItems(balanceUnits), form.topic?.questionCount ?? 0);
  const makeItSmaller = useCallback(() => {
    if (affordableItems < 1) return;
    form.changeCountText(String(affordableItems));
    flow.dismiss();
    submit(affordableItems);
  }, [affordableItems, flow, form, submit]);

  const toggleSchedule = useCallback(
    (next: boolean) => {
      form.setIsScheduled(next);
      // The phone's prompt comes now, as the reminder is being asked for.
      if (next && reminderPermission.permission?.canAsk) void reminderPermission.ask();
    },
    [form, reminderPermission],
  );

  const chooseTopic = useCallback((choice: ExamTopic['id']) => topic.choose(choice), [topic]);

  return {
    form,
    topic: topic.state,
    retryTopic: topic.retry,
    chooseTopic,
    flow,
    reminderPermission,
    affordableItems,
    makeItSmaller,
    toggleSchedule,
    submit: handleSubmit,
    visibleProblem: problem,
  };
}
