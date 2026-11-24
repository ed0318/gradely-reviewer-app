import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '@/db/client';
import { QUESTION_TYPES, type TopicQuestion } from '@/db/records';
import { countQuestionsByType, listQuestionsPage, type NumberedQuestion, type QuestionCounts } from '@/db/repositories/questionList';
import { useTopicsChangeVersion } from '@/features/topics/topicsChangeSignal';
import { addToCount, insertRowAndRenumber, removeRowAndRenumber, sumCounts } from '../questionListRows';

export const QUESTIONS_PAGE_SIZE = 60;

export type TopicQuestionsState = {
  status: 'loading' | 'ready' | 'error';
  rows: NumberedQuestion[];
  /** Per section, among the questions matching the search. */
  counts: QuestionCounts;
  /** Every question in the topic, search or not. */
  totalCount: number;
  hasMore: boolean;
};

const EMPTY_COUNTS = Object.fromEntries(QUESTION_TYPES.map((type) => [type, 0])) as QuestionCounts;
const FIRST_LOAD: TopicQuestionsState = { status: 'loading', rows: [], counts: EMPTY_COUNTS, totalCount: 0, hasMore: false };

/**
 * A topic's questions for the topic screen: a page at a time in section order,
 * filtered by `search`, with each section's count. Re-read when the screen
 * comes back into view (after the editor) and when topics change elsewhere.
 * A delete or an Undo changes the loaded rows in place instead of re-reading.
 */
export function useTopicQuestions(topicId: string, search: string) {
  const changeVersion = useTopicsChangeVersion();
  const [state, setState] = useState<TopicQuestionsState>(FIRST_LOAD);
  const [attempt, setAttempt] = useState(0);
  const loadedCountRef = useRef(0);
  const lastSearchRef = useRef(search);
  const isLoadingMoreRef = useRef(false);

  const commit = useCallback((next: TopicQuestionsState) => {
    loadedCountRef.current = next.rows.length;
    setState(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      // A new search starts from the top; coming back keeps as many rows as were showing.
      const isNewSearch = lastSearchRef.current !== search;
      lastSearchRef.current = search;
      const limit = isNewSearch ? QUESTIONS_PAGE_SIZE : Math.max(QUESTIONS_PAGE_SIZE, loadedCountRef.current);
      void openDatabase()
        .then(async (database) => {
          const [rows, counts, allCounts] = await Promise.all([
            listQuestionsPage(database, topicId, { search, limit, offset: 0 }),
            countQuestionsByType(database, topicId, search),
            search.trim() === '' ? null : countQuestionsByType(database, topicId),
          ]);
          return { rows, counts, totalCount: sumCounts(allCounts ?? counts) };
        })
        .then(({ rows, counts, totalCount }) => {
          if (isActive) commit({ status: 'ready', rows, counts, totalCount, hasMore: rows.length === limit });
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] questions not read', error);
          if (isActive) setState((previous) => (previous.status === 'ready' ? previous : { ...previous, status: 'error' }));
        });
      return () => {
        isActive = false;
      };
      // `changeVersion` and `attempt` are the triggers: a change elsewhere, and Try again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicId, search, changeVersion, attempt, commit]),
  );

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !state.hasMore || state.status !== 'ready') return;
    isLoadingMoreRef.current = true;
    void openDatabase()
      .then((database) => listQuestionsPage(database, topicId, { search, limit: QUESTIONS_PAGE_SIZE, offset: loadedCountRef.current }))
      .then((more) => {
        setState((previous) => {
          const rows = [...previous.rows, ...more];
          loadedCountRef.current = rows.length;
          return { ...previous, rows, hasMore: more.length === QUESTIONS_PAGE_SIZE };
        });
      })
      .catch((error: unknown) => console.warn('[reviewer] more questions not read', error))
      .finally(() => {
        isLoadingMoreRef.current = false;
      });
  }, [topicId, search, state.hasMore, state.status]);

  const retry = useCallback(() => {
    commit(FIRST_LOAD);
    setAttempt((count) => count + 1);
  }, [commit]);

  /** A question was deleted: drop its row and renumber, no re-read. */
  const applyRemoved = useCallback(
    (question: TopicQuestion) => {
      setState((previous) => {
        const rows = removeRowAndRenumber(previous.rows, question.id);
        loadedCountRef.current = rows.length;
        return { ...previous, rows, counts: addToCount(previous.counts, question.type, -1), totalCount: Math.max(0, previous.totalCount - 1) };
      });
    },
    [],
  );

  /** Undo: put the row back in its place. */
  const applyRestored = useCallback((restored: NumberedQuestion) => {
    setState((previous) => {
      const rows = insertRowAndRenumber(previous.rows, restored);
      loadedCountRef.current = rows.length;
      return { ...previous, rows, counts: addToCount(previous.counts, restored.question.type, 1), totalCount: previous.totalCount + 1 };
    });
  }, []);

  return { ...state, loadMore, retry, applyRemoved, applyRestored };
}
