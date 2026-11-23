import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Placeholder until its phase is built. */
export default function CreditsScreen() {
  return (
    <Screen>
      <ScreenHeader eyebrow="CREDITS" title="Credits" />
      <EmptyState icon="credits" title="Nothing here yet" subtitle="Buying credits and your credit history come here." />
    </Screen>
  );
}
