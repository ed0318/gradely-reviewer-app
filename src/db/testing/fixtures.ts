import type { AttemptQuestion, Exam, ExamAttempt, Topic, TopicQuestion } from '../records';

/** Builders for test rows. Each takes overrides for what a test cares about. */

export function buildTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 'topic-1',
    title: 'Cell biology',
    subjectLabel: 'Biology',
    generalDirections: 'Read each item carefully.',
    source: 'own',
    sourceRef: null,
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

export function buildMultipleQuestion(overrides: Partial<Extract<TopicQuestion, { type: 'multiple' }>> = {}): TopicQuestion {
  const id = overrides.id ?? 'question-multiple';
  return {
    id,
    topicId: 'topic-1',
    question: 'Which organelle makes ATP?',
    point: 1,
    sortingOrder: 0,
    type: 'multiple',
    choices: [
      { id: `${id}-a`, choiceText: 'Ribosome', isCorrect: false },
      { id: `${id}-b`, choiceText: 'Mitochondrion', isCorrect: true },
      { id: `${id}-c`, choiceText: 'Golgi body', isCorrect: false },
    ],
    ...overrides,
  };
}

/** One question of each type, in order 0–3. */
export function buildOneOfEachType(topicId = 'topic-1'): TopicQuestion[] {
  return [
    buildMultipleQuestion({ id: 'q-multiple', topicId, sortingOrder: 0 }),
    { id: 'q-truefalse', topicId, question: 'Plant cells have walls.', point: 1, sortingOrder: 1, type: 'truefalse', answerIsTrue: true },
    { id: 'q-identification', topicId, question: 'The powerhouse of the cell.', point: 2, sortingOrder: 2, type: 'identification', answer: 'Mitochondrion' },
    { id: 'q-essay', topicId, question: 'Explain osmosis.', point: 5, sortingOrder: 3, type: 'essay', answerGuide: 'Water across a membrane.', lines: 6 },
  ];
}

export function buildExam(overrides: Partial<Exam> = {}): Exam {
  return {
    id: 'exam-1',
    topicId: 'topic-1',
    name: 'Cell biology quiz',
    itemCount: 2,
    shuffleQuestions: true,
    shuffleChoices: false,
    createdAt: 2_000,
    ...overrides,
  };
}

export function buildAttempt(overrides: Partial<ExamAttempt> = {}): ExamAttempt {
  return {
    id: 'attempt-1',
    examId: 'exam-1',
    attemptNumber: 1,
    chargeId: 'charge-1',
    unitsCharged: 2,
    scheduledAt: null,
    remindMinutesBefore: null,
    notificationId: null,
    startedAt: null,
    finishedAt: null,
    score: null,
    totalPoints: null,
    status: 'ready',
    ...overrides,
  };
}

export function buildAttemptQuestions(attemptId = 'attempt-1'): AttemptQuestion[] {
  return [
    {
      id: `${attemptId}-q1`,
      attemptId,
      position: 1,
      type: 'multiple',
      question: 'Which organelle makes ATP?',
      point: 1,
      answer: null,
      choices: [
        { choiceText: 'Mitochondrion', isCorrect: true },
        { choiceText: 'Ribosome', isCorrect: false },
      ],
    },
    { id: `${attemptId}-q2`, attemptId, position: 2, type: 'truefalse', question: 'Plant cells have walls.', point: 1, answer: 'true', choices: null },
  ];
}
