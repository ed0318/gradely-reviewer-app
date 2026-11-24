import type { CascadeItem } from '@/components/ConfirmDeleteModal';

/** What deleting a topic removes and what it leaves, for the confirmation (mockup 14). */
export function buildDeleteTopicWarning(questionCount: number, examCount: number): { cascadeItems: CascadeItem[]; keepItems: CascadeItem[] } {
  const questionsLabel = questionCount === 0 ? 'This topic' : questionCount === 1 ? 'The question in it' : `All ${questionCount} questions`;
  return {
    cascadeItems: [{ label: questionsLabel, detail: 'Removed from this phone.' }],
    keepItems: [
      {
        label: examCount > 0 ? `${examCount === 1 ? 'The exam' : `The ${examCount} exams`} you made from it` : 'Exams you make from it',
        detail: 'Keep their own copy of the questions, so their scores and retakes still work.',
      },
    ],
  };
}
