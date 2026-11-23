import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Placeholder until its phase is built. */
export default function TopicsScreen() {
  return (
    <Screen>
      <ScreenHeader eyebrow="TOPICS" title="Topics" />
      <EmptyState icon="topics" title="Nothing here yet" subtitle="Topics you write will show here." />
    </Screen>
  );
}
