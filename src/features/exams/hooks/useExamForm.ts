import { useCallback, useRef, useState } from 'react';
import { useCredits } from '@/state/CreditsProvider';
import { findMaxExamItems } from '@/lib/creditUnits';
import type { NewExamPlan } from '../actions';
import {
  balanceAfterUnits,
  clampItemCount,
  cleanItemCountText,
  costOfTypedCount,
  DEFAULT_ITEM_COUNT,
  describeItemCount,
  MAX_EXAM_NAME_LENGTH,
  parseItemCountText,
  suggestExamName,
} from '../examDraft';
import { buildDefaultSchedule, composeScheduledAt, computeReminderAt, isScheduleInPast, parseRemindMinutes } from '../scheduleTimes';
import type { ExamTopic } from './useExamTopic';

const DEFAULT_REMIND_MINUTES = '30';

/**
 * The create-exam form: its fields, and everything worked out from them (the
 * cost, the balance after, what is wrong). No saving here; `useCreateExam` does that.
 */
export function useExamForm() {
  const { balanceUnits } = useCredits();
  const [name, setNameState] = useState('');
  const isNameEditedRef = useRef(false);
  const [topic, setTopic] = useState<ExamTopic | null>(null);
  const [countText, setCountText] = useState(String(DEFAULT_ITEM_COUNT));
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [initialSchedule] = useState(() => buildDefaultSchedule(new Date()));
  const [day, setDayState] = useState(initialSchedule.day);
  const [clockTime, setClockTimeState] = useState(initialSchedule.clockTime);
  // When the schedule was last touched: what "has the reminder time passed" is judged against while drawing, since a render may not read the clock.
  const [touchedAt, setTouchedAt] = useState(() => Date.now());
  const [remindText, setRemindText] = useState(DEFAULT_REMIND_MINUTES);

  const questionCount = topic?.questionCount ?? 0;
  const typedCount = parseItemCountText(countText);
  const hint = describeItemCount(typedCount, questionCount);
  const costUnits = costOfTypedCount(typedCount, questionCount);
  const scheduledAt = isScheduled ? composeScheduledAt(day, clockTime) : null;
  const remindMinutes = parseRemindMinutes(remindText);

  const setName = useCallback((next: string) => {
    isNameEditedRef.current = true;
    setNameState(next.slice(0, MAX_EXAM_NAME_LENGTH));
  }, []);

  /** A topic was read (first load or "Change"): its name suggestion, and a count that fits it. */
  const applyTopic = useCallback((next: ExamTopic) => {
    setTopic(next);
    if (!isNameEditedRef.current) setNameState(suggestExamName(next.title, next.examCount));
    setCountText((current) => {
      const typed = parseItemCountText(current) ?? DEFAULT_ITEM_COUNT;
      return String(next.questionCount > 0 ? clampItemCount(typed, next.questionCount) : DEFAULT_ITEM_COUNT);
    });
  }, []);

  const setDay = useCallback((next: Date) => {
    setTouchedAt(Date.now());
    setDayState(next);
  }, []);
  const setClockTime = useCallback((next: Date) => {
    setTouchedAt(Date.now());
    setClockTimeState(next);
  }, []);
  const changeCountText = useCallback((text: string) => setCountText(cleanItemCountText(text)), []);
  const stepCount = useCallback(
    (step: 1 | -1) => setCountText((current) => String(clampItemCount((parseItemCountText(current) ?? 1) + step, questionCount))),
    [questionCount],
  );
  const changeRemindText = useCallback((text: string) => {
    setTouchedAt(Date.now());
    setRemindText(text.replace(/\D/g, '').slice(0, 4));
  }, []);

  /** What is wrong with the form, judged at `now` (the moment of submitting). Null when it can be saved. */
  function findProblem(now: number): string | null {
    if (name.trim() === '') return 'Give the exam a name.';
    if (!hint.isValid) return hint.text;
    if (scheduledAt !== null && isScheduleInPast(scheduledAt, now)) return 'Pick a time that has not passed yet.';
    return null;
  }

  /** The exam as asked for, for saving, judged at `now`. Null while the form has a problem. `itemCount` overrides the typed count ("Make it N items"). */
  function buildPlan(now: number, itemCountOverride?: number): NewExamPlan | null {
    if (!topic || name.trim() === '') return null;
    const itemCount = itemCountOverride ?? typedCount;
    if (itemCount === null || itemCount < 1 || itemCount > findMaxExamItems(topic.questionCount)) return null;
    if (scheduledAt !== null && isScheduleInPast(scheduledAt, now)) return null;
    return {
      examName: name.trim(),
      topicId: topic.id,
      itemCount,
      shuffleQuestions,
      shuffleChoices,
      schedule: scheduledAt === null ? null : { scheduledAt, remindMinutesBefore: remindMinutes },
    };
  }

  return {
    name,
    setName,
    topic,
    applyTopic,
    countText,
    changeCountText,
    stepCount,
    hint,
    costUnits,
    itemCount: hint.isValid ? typedCount : null,
    balanceUnits,
    balanceAfter: balanceAfterUnits(balanceUnits, costUnits),
    shuffleQuestions,
    setShuffleQuestions,
    shuffleChoices,
    setShuffleChoices,
    isScheduled,
    setIsScheduled,
    day,
    setDay,
    clockTime,
    setClockTime,
    remindText,
    changeRemindText,
    reminderAt: scheduledAt === null ? null : computeReminderAt(scheduledAt, remindMinutes, touchedAt),
    scheduledAt,
    remindMinutes,
    findProblem,
    buildPlan,
  };
}

export type ExamForm = ReturnType<typeof useExamForm>;
