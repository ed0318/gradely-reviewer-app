import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useUpNext } from '@/features/account/hooks/useUpNext';
import { UpNextCard } from '@/features/exams/components/UpNextCard';
import { buildGreeting } from '@/lib/personName';
import { useSignedInSession } from '@/state/AccountProvider';
import { space } from '@/theme/theme';

/** Home: gradely-app's header (date, credits, picture), then Up next. Topics and exams follow in Phases 5–6. */
export default function HomeScreen() {
  const { profile } = useSignedInSession();
  const upNext = useUpNext();
  const today = new Date();
  const eyebrow = today.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <Screen>
      <ScreenHeader eyebrow={eyebrow} title={`${buildGreeting(today).replace(',', '')}, ${profile.firstName}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {upNext && <UpNextCard upNext={upNext} />}
        <EmptyState icon="topics" title="No topics yet" subtitle="Your topics and exams will show here." />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingBottom: 32, gap: space.gap },
});
