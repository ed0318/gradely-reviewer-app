import { buildFinishedExam, type DummyExam, type ExamSpec } from './dummyExamData';
import type { DummyTopic } from './dummyTopicData';

/**
 * DEV ONLY. More finished exams for the Progress tab, on top of the exams in
 * `dummyExamData.ts`: two ordinary ones so the picker holds about six, and one
 * with 200 finished attempts to check the 200 ms target. Written by
 * `useSeedDummyProgress.ts`; delete `src/db/dev` to remove all of it.
 */
const PROGRESS_SPECS: ExamSpec[] = [
  { id: 'dev-seed-exam-let-reading', name: 'LET Gen Ed — Reading', topicId: 'dev-seed-let-english', finishedAttempts: 3, startAccuracy: 0.6, endAccuracy: 0.78 },
  { id: 'dev-seed-exam-algebra', name: 'Algebra speed round', topicId: 'dev-seed-civil-service', finishedAttempts: 1, startAccuracy: 0.73, endAccuracy: 0.73 },
  { id: 'dev-seed-exam-stress-200', name: 'Stress test — 200 attempts', topicId: 'dev-seed-civil-service', finishedAttempts: 200, startAccuracy: 0.4, endAccuracy: 0.95 },
];

export function buildDummyProgressExams(topics: readonly DummyTopic[], now: number): DummyExam[] {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const built: DummyExam[] = [];
  for (const spec of PROGRESS_SPECS) {
    const topic = topicById.get(spec.topicId);
    if (topic) built.push(buildFinishedExam(spec, topic, now));
  }
  return built;
}

/** Ids of the topics these exams are built from. */
export const DUMMY_PROGRESS_TOPIC_IDS: readonly string[] = [...new Set(PROGRESS_SPECS.map((spec) => spec.topicId))];
