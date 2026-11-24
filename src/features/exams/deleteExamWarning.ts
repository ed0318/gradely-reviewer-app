import type { CascadeItem } from '@/components/ConfirmDeleteModal';

/** What deleting an exam removes and what it leaves, for the confirmation (mockup 15). */
export function buildDeleteExamWarning(attemptCount: number): { cascadeItems: CascadeItem[]; keepItems: CascadeItem[] } {
  const attempts = attemptCount === 1 ? 'The attempt' : `All ${attemptCount} attempts`;
  return {
    cascadeItems: [
      { label: attempts, detail: 'And their scores are removed from Progress.' },
      { label: 'Credits already used', detail: "Aren't refunded." },
    ],
    keepItems: [{ label: 'The topic and its questions', detail: 'Stay. You can make a new exam from it anytime.' }],
  };
}
