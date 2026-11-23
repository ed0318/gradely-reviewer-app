import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { PaperScreen } from '@/components/PaperScreen';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Placeholder until its phase is built. */
export default function TopicsScreen() {
  return (
    <PaperScreen>
      <ScreenHeader title="Your topics." />
      <EmptyState icon="topics" title="Nothing here yet." body="Topics you write will show here." />
    </PaperScreen>
  );
}
