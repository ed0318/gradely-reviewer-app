import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import type { Topic } from '@/db/records';
import { countExamsByTopic } from '@/db/repositories/exams';
import { getTopic } from '@/db/repositories/topics';
import { useTopicsChangeVersion } from '../topicsChangeSignal';

export type TopicSummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; topic: Topic; examCount: number };

/** The topic's header: its own row and how many exams came from it. Re-read on focus and when topics change. */
export function useTopicSummary(topicId: string) {
  const changeVersion = useTopicsChangeVersion();
  const [state, setState] = useState<TopicSummaryState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void openDatabase()
        .then(async (database) => ({ topic: await getTopic(database, topicId), examCount: await countExamsByTopic(database, topicId) }))
        .then(({ topic, examCount }) => {
          if (isActive) setState(topic ? { status: 'ready', topic, examCount } : { status: 'missing' });
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] topic not read', error);
          if (isActive) setState((previous) => (previous.status === 'ready' ? previous : { status: 'error' }));
        });
      return () => {
        isActive = false;
      };
      // `changeVersion` and `attempt` are the triggers: a change elsewhere, and Try again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicId, changeVersion, attempt]),
  );

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  /** Shows a rename at once, without reading the topic again. */
  const applyHeader = useCallback((header: Pick<Topic, 'title' | 'subjectLabel' | 'generalDirections'>) => {
    setState((previous) => (previous.status === 'ready' ? { ...previous, topic: { ...previous.topic, ...header } } : previous));
  }, []);

  return { state, retry, applyHeader };
}
