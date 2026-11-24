import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ActivityIndicator, View } from 'react-native';
import { color } from '@/theme/theme';
import { TakeExamSession } from '@/features/exams/components/TakeExamSession';
import { useAttemptToTake } from '@/features/exams/hooks/useAttemptToTake';

/** Taking an exam (mockup 6). `id` is the attempt's id. Works offline: everything it needs is already on the phone. */
export default function TakeExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tries, setTries] = useState(0);
  const attempt = useAttemptToTake(id, tries);

  if (attempt.status === 'ready') {
    return (
      <Screen>
        <TakeExamSession data={attempt} />
      </Screen>
    );
  }
  if (attempt.status === 'loading') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} accessibilityLabel="Opening exam" />
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar label="Back" />
      {attempt.status === 'error' ? (
        <>
          <EmptyState icon="error" title="Couldn't open the exam" subtitle="Something went wrong reading it from this phone." />
          <Button variant="quiet" label="Try again" onPress={() => setTries((count) => count + 1)} />
        </>
      ) : attempt.status === 'waiting' ? (
        <EmptyState icon="wifi" title="Still being made" subtitle="This exam is waiting for an internet connection to be created. It will be ready once you are back online." />
      ) : (
        <EmptyState icon="exam" title="This exam is gone" subtitle="It may have been deleted." />
      )}
    </Screen>
  );
}
