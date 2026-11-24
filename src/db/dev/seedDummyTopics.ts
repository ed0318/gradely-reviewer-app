import type { SQLiteDatabase } from 'expo-sqlite';
import { insertQuestion } from '../repositories/questions';
import { getTopic, insertTopic } from '../repositories/topics';
import type { DummyTopic } from './dummyTopicData';

/**
 * DEV ONLY. Writes one dummy topic with its questions, through the same
 * repositories the app uses. Skips a topic that is already there, so a seed that
 * was cut short can simply run again. Returns true when it wrote the topic.
 * The caller runs each topic in its own `queueWrite`, so a big one does not hold
 * up everything else.
 */
export async function seedDummyTopic(database: SQLiteDatabase, topic: DummyTopic, updatedAt: number): Promise<boolean> {
  if (await getTopic(database, topic.id)) return false;
  await insertTopic(database, {
    id: topic.id,
    title: topic.title,
    subjectLabel: topic.subjectLabel,
    generalDirections: topic.generalDirections,
    source: 'own',
    sourceRef: null,
    createdAt: updatedAt,
    updatedAt,
  });
  // `insertQuestion` touches the topic with the time it is given: the same one, so the order of the list stays as seeded.
  for (const question of topic.questions) await insertQuestion(database, question, updatedAt);
  return true;
}
