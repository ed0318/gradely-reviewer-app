import { openDatabase, queueWrite } from '@/db/client';
import {
  finishAttempt,
  listAttemptAnswers,
  listAttemptQuestions,
  saveAttemptAnswer,
  saveAttemptFlag,
  saveAttemptProgress,
  saveAttemptScore,
  saveEssayVerdict,
  startAttempt,
} from '@/db/repositories/attempts';
import type { AttemptAnswer, AttemptQuestion } from '@/db/records';
import { createId } from '@/lib/ids';
import { checkAnswer } from './checkAnswer';
import { announceExamsChanged } from './examsChangeSignal';
import { scoreAttempt, type AttemptScoreSummary } from './scoreAttempt';

/** Taking an attempt and marking it. Each write is queued, so answers land in the order they were given. */

/** What the student has put for one question, as the screen holds it. */
export type GivenAnswer = { given: string | null; isFlagged: boolean };

export async function beginAttempt(attemptId: string): Promise<void> {
  const isStarted = await queueWrite((database) => startAttempt(database, attemptId, Date.now()));
  if (isStarted) announceExamsChanged();
}

export async function readAttemptContent(attemptId: string): Promise<{ questions: AttemptQuestion[]; answers: AttemptAnswer[] }> {
  const database = await openDatabase();
  return { questions: await listAttemptQuestions(database, attemptId), answers: await listAttemptAnswers(database, attemptId) };
}

/** Saves one answer the moment it is given. The app checks what it can; an essay waits for marking. */
export function saveGivenAnswer(question: AttemptQuestion, given: string | null): Promise<void> {
  return queueWrite((database) =>
    saveAttemptAnswer(database, { id: createId(), attemptQuestionId: question.id, givenAnswer: given, isCorrect: checkAnswer(question, given), isFlagged: false }),
  );
}

export function saveFlag(questionId: string, isFlagged: boolean): Promise<void> {
  return queueWrite((database) => saveAttemptFlag(database, { id: createId(), attemptQuestionId: questionId, isFlagged }));
}

export function saveProgress(attemptId: string, currentPosition: number, elapsedSeconds: number): Promise<void> {
  return queueWrite((database) => saveAttemptProgress(database, attemptId, { currentPosition, elapsedSeconds }));
}

/** The answers as scoring reads them, from what the screen holds. */
export function toAnswerRows(questions: readonly AttemptQuestion[], given: Record<string, GivenAnswer>): AttemptAnswer[] {
  return questions.flatMap((question) => {
    const entry = given[question.id];
    if (!entry) return [];
    return [{ id: '', attemptQuestionId: question.id, givenAnswer: entry.given, isCorrect: checkAnswer(question, entry.given), isFlagged: entry.isFlagged }];
  });
}

/** Scores the attempt and finishes it. Returns the score; null if it was already finished. */
export async function submitAttempt(attemptId: string, questions: readonly AttemptQuestion[], given: Record<string, GivenAnswer>, elapsedSeconds: number): Promise<AttemptScoreSummary | null> {
  const summary = scoreAttempt(questions, toAnswerRows(questions, given));
  const isFinished = await queueWrite((database) =>
    finishAttempt(database, attemptId, { score: summary.score, totalPoints: summary.totalPoints, finishedAt: Date.now(), elapsedSeconds }),
  );
  announceExamsChanged();
  return isFinished ? summary : null;
}

/** The student's verdict on an essay, then the score again with it counted. Returns the new score. */
export async function markEssay(
  attemptId: string,
  questions: readonly AttemptQuestion[],
  answers: readonly AttemptAnswer[],
  questionId: string,
  isCorrect: boolean,
): Promise<AttemptScoreSummary> {
  const updated = answers.map((answer) => (answer.attemptQuestionId === questionId ? { ...answer, isCorrect } : answer));
  const summary = scoreAttempt(questions, updated);
  await queueWrite(async (database) => {
    await saveEssayVerdict(database, questionId, isCorrect);
    await saveAttemptScore(database, attemptId, { score: summary.score, totalPoints: summary.totalPoints });
  });
  announceExamsChanged();
  return summary;
}
