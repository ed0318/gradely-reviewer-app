/** The shapes repositories read and write. Times are epoch milliseconds; credits are integer units. */

export const QUESTION_TYPES = ['multiple', 'truefalse', 'identification', 'essay'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export type DirectionsMode = 'template' | 'custom' | 'none';
export type TopicSource = 'own' | 'marketplace';
export type AttemptStatus = 'scheduled' | 'ready' | 'in_progress' | 'finished';

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
