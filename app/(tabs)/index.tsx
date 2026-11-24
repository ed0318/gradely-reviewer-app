import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useUpNext } from '@/features/account/hooks/useUpNext';
import { ContinueReviewingList } from '@/features/exams/components/ContinueReviewingList';
import { NewExamCard } from '@/features/exams/components/NewExamCard';
import { PendingChargesNote } from '@/features/exams/components/PendingChargesNote';
import { UpNextCard } from '@/features/exams/components/UpNextCard';
import { useContinueReviewing } from '@/features/exams/hooks/useContinueReviewing';
import { usePendingCharges } from '@/features/exams/hooks/usePendingCharges';
import { NewTopicCard } from '@/features/topics/components/NewTopicCard';
import { NewTopicDialog } from '@/features/topics/components/NewTopicDialog';
import { YourTopicsStrip } from '@/features/topics/components/YourTopicsStrip';
import { useTopicsList } from '@/features/topics/hooks/useTopicsList';
import { buildGreeting } from '@/lib/personName';
import { useSignedInSession } from '@/state/AccountProvider';
import { space } from '@/theme/theme';

/** How many topics the "Your topics" strip shows. */
const RECENT_TOPICS = 10;

/** How many exams "Continue reviewing" lists. The rest are on Progress. */
const REVIEWED_EXAMS = 5;

/** Home: gradely-app's header (date, credits, picture), Up next, New exam and New topic, Continue reviewing, Your topics. */
export default function HomeScreen() {
  const { profile } = useSignedInSession();
  const upNext = useUpNext();
  const pending = usePendingCharges();
  const reviewing = useContinueReviewing(REVIEWED_EXAMS);
  const recentTopics = useTopicsList(RECENT_TOPICS);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const openNewTopic = useCallback(() => setIsNewTopicOpen(true), []);
  const closeNewTopic = useCallback(() => setIsNewTopicOpen(false), []);
  const today = new Date();
  const eyebrow = today.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <Screen>
      <ScreenHeader eyebrow={eyebrow} title={`${buildGreeting(today).replace(',', '')}, ${profile.firstName}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PendingChargesNote pending={pending} />
        {upNext && <UpNextCard upNext={upNext} />}
        <View style={styles.cards}>
          <NewExamCard />
          <NewTopicCard onPress={openNewTopic} />
        </View>
        <ContinueReviewingList reviewing={reviewing} />
        {recentTopics.items.length > 0 && <YourTopicsStrip topics={recentTopics.items} />}
      </ScrollView>
      <NewTopicDialog visible={isNewTopicOpen} onClose={closeNewTopic} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: { flexDirection: 'row', gap: space.gap },
  content: { paddingHorizontal: space.gutter, paddingBottom: 32, gap: space.gap },
});
