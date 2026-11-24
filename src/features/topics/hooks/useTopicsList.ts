import { useCallback, useRef, useState } from 'react';
import { useIsMountedRef } from '@/state/useIsMountedRef';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import type { TopicListItem } from '@/db/records';
import { listTopicsPage } from '@/db/repositories/topics';
import { useTopicsChangeVersion } from '../topicsChangeSignal';

export type TopicsListState = {
  items: TopicListItem[];
  status: 'loading' | 'ready' | 'error';
  hasMore: boolean;
};

const FIRST_LOAD: TopicsListState = { items: [], status: 'loading', hasMore: false };

/**
 * Topics, most recently edited first, a page at a time. Re-read whenever the
 * screen comes into view or the topics change elsewhere, keeping as many as
 * were already showing so the list does not jump back to the top.
 */
export function useTopicsList(pageSize: number) {
  const changeVersion = useTopicsChangeVersion();
  const [state, setState] = useState<TopicsListState>(FIRST_LOAD);
  const [attempt, setAttempt] = useState(0);
  const loadedCountRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const isMountedRef = useIsMountedRef();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const limit = Math.max(pageSize, loadedCountRef.current);
      void openDatabase()
        .then((database) => listTopicsPage(database, { limit, offset: 0 }))
        .then((items) => {
          if (!isActive) return;
          loadedCountRef.current = items.length;
          setState({ items, status: 'ready', hasMore: items.length === limit });
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] topics not read', error);
          if (isActive) setState((previous) => ({ ...previous, status: previous.items.length > 0 ? previous.status : 'error' }));
        });
      return () => {
        isActive = false;
      };
      // `changeVersion` and `attempt` are the triggers: a change elsewhere, and Try again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize, changeVersion, attempt]),
  );

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !state.hasMore || state.status !== 'ready') return;
    isLoadingMoreRef.current = true;
    void openDatabase()
      .then((database) => listTopicsPage(database, { limit: pageSize, offset: loadedCountRef.current }))
      .then((more) => {
        if (!isMountedRef.current) return;
        loadedCountRef.current += more.length;
        setState((previous) => ({ ...previous, items: [...previous.items, ...more], hasMore: more.length === pageSize }));
      })
      .catch((error: unknown) => console.warn('[reviewer] more topics not read', error))
      .finally(() => {
        isLoadingMoreRef.current = false;
      });
  }, [pageSize, state.hasMore, state.status, isMountedRef]);

  const retry = useCallback(() => {
    setState(FIRST_LOAD);
    setAttempt((count) => count + 1);
  }, []);

  return { ...state, loadMore, retry };
}
