import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Placeholder until its phase is built. */
export default function ProgressScreen() {
  return (
    <Screen>
      <ScreenHeader eyebrow="PROGRESS" title="Progress" />
      <EmptyState icon="progress" title="Nothing here yet" subtitle="Scores from your exams will show here." />
    </Screen>
  );
}
