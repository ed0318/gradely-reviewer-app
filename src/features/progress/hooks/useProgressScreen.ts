import { useCallback, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import type { ProgressExam } from '@/db/repositories/progress';
import { removeExam } from '@/features/exams/actions';
import { loadAttemptCountForDelete } from '../actions';
import { useProgressExams, type ProgressExamsState } from './useProgressExams';

export type ProgressScreenState = {
  status: ProgressExamsState['status'];
  exams: ProgressExam[];
  /** The exam on show: the one asked for by the route, else the one taken most recently. Null when no exam has a score yet. */
  selected: ProgressExam | null;
  chooseExam: (examId: string) => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  /** Null when the delete confirmation is closed. */
  deleteWarningAttemptCount: number | null;
  openDelete: () => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
  retry: () => void;
};

/**
 * The Progress tab: which exam is on show, the picker, and deleting it. The exam
 * lives in the route (`?examId=`), so Home can open the tab on an exam and a pick
 * made here is what Home would send.
 */
export function useProgressScreen(): ProgressScreenState {
  const { examId: requestedExamId } = useLocalSearchParams<{ examId?: string }>();
  const list = useProgressExams();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [deleteWarningAttemptCount, setDeleteWarningAttemptCount] = useState<number | null>(null);

  const selected = useMemo(
    () => list.exams.find((exam) => exam.examId === requestedExamId) ?? list.exams[0] ?? null,
    [list.exams, requestedExamId],
  );

  const chooseExam = useCallback((examId: string) => {
    setIsPickerOpen(false);
    router.setParams({ examId });
  }, []);
  const openPicker = useCallback(() => setIsPickerOpen(true), []);
  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  const selectedExamId = selected?.examId ?? null;
  const openDelete = useCallback(() => {
    if (!selectedExamId) return;
    loadAttemptCountForDelete(selectedExamId)
      .then(setDeleteWarningAttemptCount)
      .catch((error: unknown) => console.warn('[reviewer] attempt count not read', error));
  }, [selectedExamId]);
  const cancelDelete = useCallback(() => setDeleteWarningAttemptCount(null), []);
  const confirmDelete = useCallback(() => {
    setDeleteWarningAttemptCount(null);
    if (!selectedExamId) return;
    router.setParams({ examId: undefined });
    removeExam(selectedExamId).catch((error: unknown) => console.warn('[reviewer] exam not deleted', error));
  }, [selectedExamId]);

  return {
    status: list.status,
    exams: list.exams,
    selected,
    chooseExam,
    isPickerOpen,
    openPicker,
    closePicker,
    deleteWarningAttemptCount,
    openDelete,
    cancelDelete,
    confirmDelete,
    retry: list.retry,
  };
}
