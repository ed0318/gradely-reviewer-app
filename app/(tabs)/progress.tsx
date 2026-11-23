import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { PaperScreen } from '@/components/PaperScreen';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Placeholder until its phase is built. */
export default function ProgressScreen() {
  return (
    <PaperScreen>
      <ScreenHeader title="Your progress." />
      <EmptyState icon="progress" title="Nothing here yet." body="Scores from your exams will show here." />
    </PaperScreen>
  );
}
