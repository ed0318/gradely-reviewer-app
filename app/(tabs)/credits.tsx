import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { PaperScreen } from '@/components/PaperScreen';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Placeholder until its phase is built. */
export default function CreditsScreen() {
  return (
    <PaperScreen>
      <ScreenHeader title="Credits." />
      <EmptyState icon="credits" title="Nothing here yet." body="Buying credits and your credit history come here." />
    </PaperScreen>
  );
}
