import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { openDatabase } from '@/db/client';
import type { AttemptQuestion, Exam, ExamAttempt } from '@/db/records';
import { getAttemptWithExam } from '@/db/repositories/exams';
import { beginAttempt, readAttemptContent, type GivenAnswer } from '../attemptActions';

export type AttemptToTake =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  /** Still being charged for: it cannot be taken yet. */
  | { status: 'waiting' }
  | { status: 'ready'; attempt: ExamAttempt; exam: Exam; questions: AttemptQuestion[]; given: Record<string, GivenAnswer> };

/**
 * Opens an attempt to take: starts it if it has not been, and reads its
 * questions and the answers already given, so a killed exam resumes where it
 * was. A finished attempt goes straight to its results.
 */
export function useAttemptToTake(attemptId: string, attempt: number): AttemptToTake {
  const [state, setState] = useState<AttemptToTake>({ status: 'loading' });

  useEffect(() => {
    let isActive = true;
    void (async () => {
      const found = await getAttemptWithExam(await openDatabase(), attemptId);
      if (!isActive) return;
      if (!found) return setState({ status: 'missing' });
      if (found.attempt.status === 'finished') return router.replace({ pathname: '/exam/[id]/results', params: { id: attemptId } });
      if (found.attempt.status === 'charging') return setState({ status: 'waiting' });
      if (found.attempt.status !== 'in_progress') await beginAttempt(attemptId);
      const { questions, answers } = await readAttemptContent(attemptId);
      if (!isActive) return;
      const given: Record<string, GivenAnswer> = {};
      for (const answer of answers) given[answer.attemptQuestionId] = { given: answer.givenAnswer, isFlagged: answer.isFlagged };
      setState({ status: 'ready', attempt: found.attempt, exam: found.exam, questions, given });
    })().catch((error: unknown) => {
      console.warn('[reviewer] attempt not opened', error);
      if (isActive) setState({ status: 'error' });
    });
    return () => {
      isActive = false;
    };
  }, [attemptId, attempt]);

  return state;
}
