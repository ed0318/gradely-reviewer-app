import { queueWrite } from '@/db/client';
import { deleteTopic, insertTopic, updateTopicHeader } from '@/db/repositories/topics';
import { createId } from '@/lib/ids';
import { toTopicHeader, type TopicHeaderInput } from './topicHeader';
import { announceTopicsChanged } from './topicsChangeSignal';

/** Makes a topic on the phone: free and offline. Returns its id. */
export async function createTopic(input: TopicHeaderInput, now: number = Date.now()): Promise<string> {
  const id = createId();
  const header = toTopicHeader(input);
  await queueWrite((database) => insertTopic(database, { id, ...header, source: 'own', sourceRef: null, createdAt: now, updatedAt: now }));
  return id;
}

/** Saves the title, subject and general directions. False when the topic is gone. */
export async function renameTopic(topicId: string, input: TopicHeaderInput, now: number = Date.now()): Promise<boolean> {
  return queueWrite((database) => updateTopicHeader(database, topicId, toTopicHeader(input), now));
}

/**
 * Deletes the topic and its questions. Exams made from it keep their own copy.
 * Tells the lists to re-read: the screen behind may come into view before the delete has landed.
 */
export async function removeTopic(topicId: string): Promise<boolean> {
  const isRemoved = await queueWrite((database) => deleteTopic(database, topicId));
  announceTopicsChanged();
  return isRemoved;
}
