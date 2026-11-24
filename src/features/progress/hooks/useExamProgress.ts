import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useExamsChangeVersion } from '@/features/exams/examsChangeSignal';
import { loadAttemptsPage, loadExamSummary, type AttemptsPage, type ExamSummary } from '../actions';
import { describePaging, type PagingSummary } from '../paging';

type Loaded<T> = { examId: string; value: T };

export type ExamProgress = {
  /** Null until this exam's stats and chart have been read. */
  summary: ExamSummary | null;
  /** Null until this exam's page has been read. Kept while the next page loads. */
  page: AttemptsPage | null;
  paging: PagingSummary;
  isFailed: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  retry: () => void;
};

/**
 * One exam's Progress: the stats and chart (two small queries) and the page of
 * attempts (one). Choosing another exam starts again at page 1; paging only
 * re-reads the page. Reads again when the tab comes into view or an exam changes.
 */
export function useExamProgress(examId: string): ExamProgress {
  const changeVersion = useExamsChangeVersion();
  const [retryCount, setRetryCount] = useState(0);
  const [summaryResult, setSummaryResult] = useState<Loaded<ExamSummary> | null>(null);
  const [pageResult, setPageResult] = useState<Loaded<AttemptsPage> | null>(null);
  const [isFailed, setIsFailed] = useState(false);
  // The page asked for belongs to an exam, so another exam always begins at page 1.
  const [pageRequest, setPageRequest] = useState({ examId, pageIndex: 0 });
  const requestedPageIndex = pageRequest.examId === examId ? pageRequest.pageIndex : 0;

  const summary = summaryResult?.examId === examId ? summaryResult.value : null;
  const paging = useMemo(() => describePaging(summary?.stats.tries ?? 0, requestedPageIndex), [summary, requestedPageIndex]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadExamSummary(examId)
        .then((value) => {
          if (!isActive) return;
          setSummaryResult({ examId, value });
          setIsFailed(false);
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] exam progress not read', error);
          if (isActive) setIsFailed(true);
        });
      return () => {
        isActive = false;
      };
      // `changeVersion` and `retryCount` are the triggers: a change elsewhere, and Try again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId, changeVersion, retryCount]),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadAttemptsPage(examId, requestedPageIndex)
        .then((value) => {
          if (isActive) setPageResult({ examId, value });
        })
        .catch((error: unknown) => {
          console.warn('[reviewer] attempts page not read', error);
          if (isActive) setIsFailed(true);
        });
      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId, requestedPageIndex, changeVersion, retryCount]),
  );

  const goToPreviousPage = useCallback(() => setPageRequest({ examId, pageIndex: Math.max(0, paging.pageIndex - 1) }), [examId, paging.pageIndex]);
  const goToNextPage = useCallback(() => setPageRequest({ examId, pageIndex: paging.pageIndex + 1 }), [examId, paging.pageIndex]);
  const retry = useCallback(() => {
    setIsFailed(false);
    setRetryCount((count) => count + 1);
  }, []);

  return { summary, page: pageResult?.examId === examId ? pageResult.value : null, paging, isFailed, goToPreviousPage, goToNextPage, retry };
}
