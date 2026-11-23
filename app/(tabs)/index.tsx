import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandLockup } from '@/components/BrandLockup';
import { EmptyState } from '@/components/EmptyState';
import { PaperScreen } from '@/components/PaperScreen';
import { ProfileGreeting } from '@/features/account/components/ProfileGreeting';
import { useUpNext } from '@/features/account/hooks/useUpNext';
import { resolvePhotoUri } from '@/features/account/profilePhoto';
import { CreditsPill } from '@/features/credits/components/CreditsPill';
import { UpNextCard } from '@/features/exams/components/UpNextCard';
import { useSignedInSession } from '@/state/AccountProvider';
import { useCredits } from '@/state/CreditsProvider';

/** Mockup 2: the header (logo, credits, who is signed in) and Up next. Topics and exams follow in Phases 5–6. */
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSignedInSession();
  const { balanceUnits } = useCredits();
  const upNext = useUpNext();

  return (
    <PaperScreen>
      <View style={styles.header}>
        <BrandLockup />
        <CreditsPill balanceUnits={balanceUnits} onPress={() => router.push('/credits')} />
      </View>
      <ProfileGreeting
        firstName={profile.firstName}
        lastName={profile.lastName}
        photoUri={resolvePhotoUri(profile.photoPath)}
        onPress={() => router.push('/settings')}
      />
      {upNext && <UpNextCard upNext={upNext} />}
      <EmptyState icon="topics" title="No topics yet." body="Your topics and exams will show here." />
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
