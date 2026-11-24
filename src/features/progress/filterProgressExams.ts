import type { ProgressExam } from '@/db/repositories/progress';

/** Exams whose name or topic contains the search, ignoring case and spaces at the ends. An empty search keeps all. */
export function filterProgressExams(exams: readonly ProgressExam[], search: string): ProgressExam[] {
  const wanted = search.trim().toLowerCase();
  if (wanted === '') return [...exams];
  return exams.filter((exam) => `${exam.name} ${exam.topicTitle ?? ''}`.toLowerCase().includes(wanted));
}

/** "6 exams" before a search, "2 of 6 exams" while searching. */
export function describeExamCount(shown: number, total: number, search: string): string {
  if (search.trim() === '') return `${total} ${total === 1 ? 'exam' : 'exams'}`;
  return `${shown} of ${total} ${total === 1 ? 'exam' : 'exams'}`;
}
