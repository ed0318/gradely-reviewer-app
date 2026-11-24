import { useCallback, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import type { TopicQuestion } from '@/db/records';
import { addBlankQuestion } from '@/features/questions/actions';
import { useQuestionDeletion } from '@/features/questions/hooks/useQuestionDeletion';
import { useSingleOpenSwipe } from '@/features/questions/hooks/useSingleOpenSwipe';
import { useTopicQuestions } from '@/features/questions/hooks/useTopicQuestions';
import { buildListEntries } from '@/features/questions/questionListRows';
import { useDebouncedValue } from '@/state/useDebouncedValue';
import { removeTopic, renameTopic } from '../actions';
import type { TopicHeaderInput } from '../topicHeader';
import { useTopicSummary } from './useTopicSummary';

const SEARCH_DELAY_MS = 250;

/**
 * Everything the topic screen shows and does: the header, the searched list of
 * questions with section headers, swipe-to-delete with Undo, Add question,
 * Rename and Delete topic. The screen is layout around this.
 */
export function useTopicScreen(topicId: string) {
  const summary = useTopicSummary(topicId);
  const [search, setSearch] = useState('');
  const settledSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const questions = useTopicQuestions(topicId, settledSearch);
  const deletion = useQuestionDeletion({ onRemoved: questions.applyRemoved, onRestored: questions.applyRestored });
  const { deleteWithUndo } = deletion;
  const { applyHeader } = summary;
  const onRowOpening = useSingleOpenSwipe();
  const [isAdding, setIsAdding] = useState(false);
  const isAddingRef = useRef(false);

  const entries = useMemo(() => buildListEntries(questions.rows, questions.counts), [questions.rows, questions.counts]);

  const openQuestion = useCallback((questionId: string) => router.push({ pathname: '/question/[id]', params: { id: questionId } }), []);

  const deleteQuestion = useCallback(
    (question: TopicQuestion, number: number) => void deleteWithUndo(question, number),
    [deleteWithUndo],
  );

  /** Adds an empty question at the end of its section and opens it. One tap, one question. */
  const addQuestion = useCallback(async () => {
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setIsAdding(true);
    try {
      const added = await addBlankQuestion(topicId);
      router.push({ pathname: '/question/[id]', params: { id: added.id } });
    } catch (error) {
      console.warn('[reviewer] question not added', error);
    } finally {
      isAddingRef.current = false;
      setIsAdding(false);
    }
  }, [topicId]);

  const makeExam = useCallback(() => router.push({ pathname: '/exam/new', params: { topicId } }), [topicId]);

  const saveHeader = useCallback(
    async (input: TopicHeaderInput) => {
      try {
        const isSaved = await renameTopic(topicId, input);
        if (isSaved) applyHeader({ title: input.title.trim(), subjectLabel: input.subject.trim() || null, generalDirections: input.directions.trim() });
        return isSaved;
      } catch (error) {
        console.warn('[reviewer] topic not renamed', error);
        return false;
      }
    },
    [topicId, applyHeader],
  );

  /** Leaves the screen, then deletes: the screen behind must not flash a topic that is going. */
  const deleteTopicAndLeave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/topics');
    void removeTopic(topicId).catch((error: unknown) => console.warn('[reviewer] topic not deleted', error));
  }, [topicId]);

  return {
    summary: summary.state,
    retrySummary: summary.retry,
    questions,
    entries,
    isSearching: settledSearch !== '',
    setSearch,
    deletion,
    onRowOpening,
    isAdding,
    openQuestion,
    deleteQuestion,
    addQuestion,
    makeExam,
    saveHeader,
    deleteTopicAndLeave,
  };
}
