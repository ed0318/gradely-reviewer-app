import type { AttemptAnswer, AttemptQuestion, Exam, ExamAttempt } from '../records';
import { checkAnswer } from '@/features/exams/checkAnswer';
import { arrangeAttemptQuestions, draftFromTopicQuestion, type RandomSource } from '@/features/exams/pickExamQuestions';
import { scoreAttempt } from '@/features/exams/scoreAttempt';
import type { DummyTopic } from './dummyTopicData';

/**
 * DEV ONLY. The mockup's exams as plain data, built from the dummy topics so
 * every attempt copies real questions. Written by `seedDummyExams.ts`; delete
 * `src/db/dev` to remove all of it.
 *
 * The dummy topics hold 14 and 15 questions, not the mockup's 30, 60 and 20, so
 * each exam has all the questions of its topic. The attempt history matches the
 * mockup's shape (a drill taken many times and getting better, a quick check
 * taken once), and the dummy server's ledger still knows only the first charge
 * of each, since the seed never calls the server.
 */

export type DummyAttempt = { attempt: ExamAttempt; questions: AttemptQuestion[]; answers: AttemptAnswer[] };
export type DummyExam = { exam: Exam; attempts: DummyAttempt[] };

export type ExamSpec = {
  id: string;
  name: string;
  topicId: string;
  /** Finished attempts, oldest first. 0 for the scheduled one. */
  finishedAttempts: number;
  /** Chance of a right answer on the first and on the last attempt. */
  startAccuracy: number;
  endAccuracy: number;
  /** Leave the essays of the newest attempt unmarked, so the self-marking can be tried. */
  leaveLastEssaysUnmarked?: boolean;
};

const SPECS: ExamSpec[] = [
  { id: 'dev-seed-exam-civil', name: 'Civil Service — Numerical drill', topicId: 'dev-seed-civil-service', finishedAttempts: 22, startAccuracy: 0.5, endAccuracy: 0.9 },
  { id: 'dev-seed-exam-let', name: 'LET Gen Ed — English', topicId: 'dev-seed-let-english', finishedAttempts: 12, startAccuracy: 0.55, endAccuracy: 0.85 },
  { id: 'dev-seed-exam-pharma', name: 'Pharmacology quick check', topicId: 'dev-seed-pharmacology', finishedAttempts: 1, startAccuracy: 0.65, endAccuracy: 0.65, leaveLastEssaysUnmarked: true },
];
const SCHEDULED_ID = 'dev-seed-exam-drill-5';

export const DAY_MS = 86_400_000;

/** A small repeatable random source (mulberry32), so the seed gives the same exams every time. */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function baseAttempt(examId: string, number: number, overrides: Partial<ExamAttempt>): ExamAttempt {
  return {
    id: `${examId}:a${number}`,
    examId,
    attemptNumber: number,
    chargeId: `dev-seed-charge:${examId}:${number}`,
    unitsCharged: 0,
    scheduledAt: null,
    remindMinutesBefore: null,
    notificationId: null,
    startedAt: null,
    finishedAt: null,
    score: null,
    totalPoints: null,
    status: 'finished',
    sourceAttemptId: null,
    onlyMissed: false,
    currentPosition: 0,
    elapsedSeconds: 0,
    ...overrides,
  };
}

function giveAnswer(question: AttemptQuestion, isRight: boolean): { given: string; isCorrect: boolean | null } {
  let given: string;
  switch (question.type) {
    case 'multiple': {
      const wanted = (question.choices ?? []).findIndex((choice) => choice.isCorrect === isRight);
      given = String(Math.max(0, wanted));
      break;
    }
    case 'truefalse':
      given = isRight === (question.answer === 'true') ? 'true' : 'false';
      break;
    case 'identification':
      given = isRight ? ` ${(question.answer ?? '').toUpperCase()} ` : 'I am not sure';
      break;
    case 'essay':
      given = 'My answer: I would explain it step by step, check it against the problem, and give one example from class.';
      // A marked essay: the student judged it as it deserved.
      return { given, isCorrect: isRight };
  }
  return { given, isCorrect: checkAnswer(question, given) };
}

function buildFinishedAttempt(spec: ExamSpec, exam: Exam, topic: DummyTopic, number: number, now: number): DummyAttempt {
  const random = createSeededRandom(number * 7919 + spec.id.length * 104729);
  const drafts = topic.questions.slice(0, exam.itemCount).map(draftFromTopicQuestion);
  const id = `${exam.id}:a${number}`;
  const questions = arrangeAttemptQuestions(id, drafts, { shuffleQuestions: exam.shuffleQuestions, shuffleChoices: exam.shuffleChoices }, random, (() => {
    let counter = 0;
    return () => `${id}:q${(counter += 1)}`;
  })());

  const progress = spec.finishedAttempts > 1 ? (number - 1) / (spec.finishedAttempts - 1) : 0;
  const accuracy = spec.startAccuracy + (spec.endAccuracy - spec.startAccuracy) * progress;
  const isNewest = number === spec.finishedAttempts;
  const answers: AttemptAnswer[] = questions.map((question) => {
    const isRight = random() < accuracy;
    const { given, isCorrect } = giveAnswer(question, isRight);
    const isUnmarked = question.type === 'essay' && isNewest && spec.leaveLastEssaysUnmarked === true;
    return { id: `${question.id}:answer`, attemptQuestionId: question.id, givenAnswer: given, isCorrect: isUnmarked ? null : isCorrect, isFlagged: false };
  });
  const { score, totalPoints } = scoreAttempt(questions, answers);

  const finishedAt = now - (spec.finishedAttempts - number) * DAY_MS - 3_600_000;
  const elapsedSeconds = 420 + Math.floor(random() * 600);
  const attempt = baseAttempt(exam.id, number, {
    unitsCharged: questions.length,
    startedAt: finishedAt - elapsedSeconds * 1000,
    finishedAt,
    elapsedSeconds,
    score,
    totalPoints,
    currentPosition: questions.length - 1,
  });
  return { attempt, questions, answers };
}

function buildScheduledAttempt(exam: Exam, topic: DummyTopic, scheduledAt: number): DummyAttempt {
  const id = `${exam.id}:a1`;
  const drafts = topic.questions.slice(0, exam.itemCount).map(draftFromTopicQuestion);
  let counter = 0;
  const questions = arrangeAttemptQuestions(id, drafts, { shuffleQuestions: true, shuffleChoices: true }, createSeededRandom(5), () => `${id}:q${(counter += 1)}`);
  const attempt = baseAttempt(exam.id, 1, { unitsCharged: questions.length, status: 'scheduled', scheduledAt, remindMinutesBefore: 30 });
  return { attempt, questions, answers: [] };
}

/** Tonight at 7 PM two days from `now`, local time. */
function inTwoDaysAtSeven(now: number): number {
  const day = new Date(now);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + 2, 19, 0, 0, 0).getTime();
}

/** An exam of `spec.finishedAttempts` finished attempts, built from `topic`'s questions. */
export function buildFinishedExam(spec: ExamSpec, topic: DummyTopic, now: number): DummyExam {
  const exam: Exam = {
    id: spec.id,
    topicId: topic.id,
    name: spec.name,
    itemCount: topic.questions.length,
    shuffleQuestions: true,
    shuffleChoices: true,
    createdAt: now - spec.finishedAttempts * DAY_MS - DAY_MS,
  };
  const attempts = Array.from({ length: spec.finishedAttempts }, (_, index) => buildFinishedAttempt(spec, exam, topic, index + 1, now));
  return { exam, attempts };
}

export function buildDummyExams(topics: readonly DummyTopic[], now: number): DummyExam[] {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const built: DummyExam[] = [];
  for (const spec of SPECS) {
    const topic = topicById.get(spec.topicId);
    if (topic) built.push(buildFinishedExam(spec, topic, now));
  }
  const civil = topicById.get('dev-seed-civil-service');
  if (civil) {
    const exam: Exam = { id: SCHEDULED_ID, topicId: civil.id, name: 'Numerical drill #5', itemCount: civil.questions.length, shuffleQuestions: true, shuffleChoices: true, createdAt: now - 3_600_000 };
    built.push({ exam, attempts: [buildScheduledAttempt(exam, civil, inTwoDaysAtSeven(now))] });
  }
  return built;
}

/** Ids of the topics the exams are built from. */
export const DUMMY_EXAM_TOPIC_IDS: readonly string[] = [...new Set([...SPECS.map((spec) => spec.topicId)])];
