/** The shapes repositories read and write. Times are epoch milliseconds; credits are integer units. */

export const QUESTION_TYPES = ['multiple', 'truefalse', 'identification', 'essay'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export type DirectionsMode = 'template' | 'custom' | 'none';
export type TopicSource = 'own' | 'marketplace';
/** `charging`: saved, and waiting for the server to take the credits. It is not an exam yet. */
export type AttemptStatus = 'charging' | 'scheduled' | 'ready' | 'in_progress' | 'finished';

export type Topic = {
  id: string;
  title: string;
  subjectLabel: string | null;
  generalDirections: string;
  source: TopicSource;
  sourceRef: string | null;
  createdAt: number;
  updatedAt: number;
};

export type TopicListItem = Pick<Topic, 'id' | 'title' | 'subjectLabel' | 'updatedAt'> & { questionCount: number };

export type SectionDirection = { questionType: QuestionType; mode: DirectionsMode; text: string };

/** One option of a multiple-choice question. The letter comes from its place in the list. */
export type QuestionChoice = { id: string; choiceText: string; isCorrect: boolean };

type QuestionBase = { id: string; topicId: string; question: string; point: number; sortingOrder: number };

export type TopicQuestion = QuestionBase &
  (
    | { type: 'multiple'; choices: QuestionChoice[] }
    | { type: 'truefalse'; answerIsTrue: boolean }
    | { type: 'identification'; answer: string }
    | { type: 'essay'; answerGuide: string | null; lines: number }
  );

export type Exam = {
  id: string;
  /** Null once the topic is deleted: the exam and its attempts stay. */
  topicId: string | null;
  name: string;
  itemCount: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  createdAt: number;
};

export type ExamAttempt = {
  id: string;
  examId: string;
  attemptNumber: number;
  /** The idempotency key the server charged under. */
  chargeId: string;
  unitsCharged: number;
  scheduledAt: number | null;
  remindMinutesBefore: number | null;
  notificationId: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  score: number | null;
  totalPoints: number | null;
  status: AttemptStatus;
  /** A retake copies its questions from this attempt. Null: they come from the topic. */
  sourceAttemptId: string | null;
  /** Only the questions the source attempt got wrong. */
  onlyMissed: boolean;
  /** Index of the question on screen, so a killed exam resumes there. */
  currentPosition: number;
  /** Time taken in seconds, paused while the app is away. */
  elapsedSeconds: number;
};

/** A choice as it was shown in the attempt, in shown order. */
export type AttemptChoice = { choiceText: string; isCorrect: boolean };

/** A question copied into an attempt, so editing or deleting the topic never changes it. */
export type AttemptQuestion = {
  id: string;
  attemptId: string;
  position: number;
  type: QuestionType;
  question: string;
  point: number;
  /** identification: the accepted answer; truefalse: 'true' or 'false'; essay: the answer guide; multiple: null. */
  answer: string | null;
  /** multiple only, in the order shown. */
  choices: AttemptChoice[] | null;
};

export type AttemptAnswer = {
  id: string;
  attemptQuestionId: string;
  givenAnswer: string | null;
  /** Null until an essay is self-marked. */
  isCorrect: boolean | null;
  /** The "come back to this" mark. */
  isFlagged: boolean;
};

export type Profile = {
  accountId: string;
  email: string;
  firstName: string;
  lastName: string;
  photoPath: string | null;
};

export type Settings = {
  lowCreditAlertOn: boolean;
  lowCreditThresholdUnits: number;
  lowCreditAlerted: boolean;
  balanceUnitsCache: number | null;
  balanceCheckedAt: number | null;
};

/** One page of a list read with LIMIT/OFFSET. */
export type PageRequest = { limit: number; offset: number };
