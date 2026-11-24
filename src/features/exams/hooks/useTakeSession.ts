import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useDebouncedSave } from '@/state/useDebouncedSave';
import { saveFlag, saveGivenAnswer, saveProgress, submitAttempt, type GivenAnswer } from '../attemptActions';
import type { ExamClock } from '../components/ExamTimerChip';
import type { AttemptToTake } from './useAttemptToTake';

type ReadyAttempt = Extract<AttemptToTake, { status: 'ready' }>;

/**
 * One sitting of an exam: which question is on screen, what has been answered
 * and flagged, the clock, and leaving or finishing. Every answer is saved as it
 * is given (typed ones a moment after typing stops, and at once on Next, Quit or
 * leaving), so a crash loses nothing, and the position is saved on every move.
 */
export function useTakeSession(data: ReadyAttempt) {
  const { attempt, questions } = data;
  const [index, setIndex] = useState(() => Math.max(0, Math.min(attempt.currentPosition, questions.length - 1)));
  const [given, setGiven] = useState<Record<string, GivenAnswer>>(data.given);
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const clockRef = useRef<ExamClock>({ seconds: attempt.elapsedSeconds });
  const indexRef = useRef(index);
  const isDoneRef = useRef(false);
  const typed = useDebouncedSave<{ questionId: string; text: string }>(({ questionId, text }) => {
    const question = questions.find((candidate) => candidate.id === questionId);
    return question ? saveGivenAnswer(question, text) : Promise.resolve();
  }, 400);
  const { flush } = typed;

  const question = questions[index];
  const answer = given[question.id];

  const persistProgress = useCallback(() => {
    if (isDoneRef.current) return;
    void saveProgress(attempt.id, indexRef.current, clockRef.current.seconds).catch((error: unknown) => console.warn('[reviewer] progress not saved', error));
  }, [attempt.id]);

  // Leaving the screen any way at all keeps the position and the time.
  useEffect(() => persistProgress, [persistProgress]);

  // Android's back asks before leaving, like Quit.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        setIsQuitOpen(true);
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= questions.length) return;
      void flush();
      indexRef.current = next;
      setIndex(next);
      persistProgress();
    },
    [flush, persistProgress, questions.length],
  );

  const choose = useCallback(
    (value: string) => {
      setGiven((previous) => ({ ...previous, [question.id]: { given: value, isFlagged: previous[question.id]?.isFlagged ?? false } }));
      void saveGivenAnswer(question, value).catch((error: unknown) => console.warn('[reviewer] answer not saved', error));
    },
    [question],
  );

  const type = useCallback(
    (text: string) => {
      setGiven((previous) => ({ ...previous, [question.id]: { given: text, isFlagged: previous[question.id]?.isFlagged ?? false } }));
      typed.schedule({ questionId: question.id, text });
    },
    [question.id, typed],
  );

  const toggleFlag = useCallback(() => {
    const next = !(answer?.isFlagged ?? false);
    setGiven((previous) => ({ ...previous, [question.id]: { given: previous[question.id]?.given ?? null, isFlagged: next } }));
    void saveFlag(question.id, next).catch((error: unknown) => console.warn('[reviewer] flag not saved', error));
  }, [answer?.isFlagged, question.id]);

  const leave = useCallback(() => {
    void flush();
    persistProgress();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [flush, persistProgress]);

  const finish = useCallback(async () => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    setIsFinishing(true);
    setIsFinishOpen(false);
    try {
      await flush();
      await submitAttempt(attempt.id, questions, given, clockRef.current.seconds);
      router.replace({ pathname: '/exam/[id]/results', params: { id: attempt.id } });
    } catch (error) {
      console.warn('[reviewer] exam not submitted', error);
      isDoneRef.current = false;
      setIsFinishing(false);
    }
  }, [attempt.id, flush, given, questions]);

  const counts = useMemo(() => {
    let unanswered = 0;
    let flagged = 0;
    for (const item of questions) {
      const entry = given[item.id];
      if (!entry || (entry.given ?? '').trim() === '') unanswered += 1;
      if (entry?.isFlagged) flagged += 1;
    }
    return { unanswered, flagged };
  }, [questions, given]);

  const isLast = index === questions.length - 1;
  const next = useCallback(() => (isLast ? setIsFinishOpen(true) : goTo(index + 1)), [goTo, index, isLast]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  return {
    index,
    question,
    answer,
    isLast,
    clockRef,
    isQuitOpen,
    setIsQuitOpen,
    isFinishOpen,
    setIsFinishOpen,
    isFinishing,
    counts,
    choose,
    type,
    toggleFlag,
    next,
    previous,
    leave,
    finish,
    persistProgress,
  };
}
