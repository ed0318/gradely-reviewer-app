import { useCallback, useEffect, useRef, useState } from 'react';
import { openDatabase } from '@/db/client';
import { countExamsByTopic } from '@/db/repositories/exams';
import { countQuestionsByTopic } from '@/db/repositories/questions';
import { getTopic, listTopicsPage } from '@/db/repositories/topics';

export type ExamTopic = { id: string; title: string; questionCount: number; examCount: number };

export type ExamTopicState = { status: 'loading' } | { status: 'error' } | { status: 'empty' } | { status: 'ready'; topic: ExamTopic };

const DEFAULT_PICK_WINDOW = 30;

async function readExamTopic(topicId: string): Promise<ExamTopic | null> {
  const database = await openDatabase();
  const topic = await getTopic(database, topicId);
  if (!topic) return null;
  return { id: topic.id, title: topic.title, questionCount: await countQuestionsByTopic(database, topicId), examCount: await countExamsByTopic(database, topicId) };
}

/** With no topic given: the most recently edited one that has questions, else the most recent. Null with no topics at all. */
async function readDefaultExamTopic(): Promise<ExamTopic | null> {
  const database = await openDatabase();
  const recent = await listTopicsPage(database, { limit: DEFAULT_PICK_WINDOW, offset: 0 });
  const pick = recent.find((topic) => topic.questionCount > 0) ?? recent[0];
  return pick ? readExamTopic(pick.id) : null;
}

/**
 * The topic the exam is made from. Starts with the one it was opened for (or a
 * sensible default), and `choose` swaps it. `onLoaded` runs with each topic once
 * read, so the form can set its defaults from it.
 */
export function useExamTopic(initialTopicId: string | undefined, onLoaded: (topic: ExamTopic) => void) {
  const [state, setState] = useState<ExamTopicState>({ status: 'loading' });
  const [request, setRequest] = useState<{ topicId: string | undefined; version: number }>({ topicId: initialTopicId, version: 0 });
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  useEffect(() => {
    let isActive = true;
    void (async () => {
      const topic = (request.topicId ? await readExamTopic(request.topicId) : null) ?? (await readDefaultExamTopic());
      if (!isActive) return;
      if (!topic) {
        setState({ status: 'empty' });
        return;
      }
      onLoadedRef.current(topic);
      setState({ status: 'ready', topic });
    })().catch((error: unknown) => {
      console.warn('[reviewer] exam topic not read', error);
      if (isActive) setState((previous) => (previous.status === 'ready' ? previous : { status: 'error' }));
    });
    return () => {
      isActive = false;
    };
  }, [request]);

  const choose = useCallback((topicId: string) => setRequest((previous) => ({ topicId, version: previous.version + 1 })), []);
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequest((previous) => ({ ...previous, version: previous.version + 1 }));
  }, []);

  return { state, choose, retry };
}
