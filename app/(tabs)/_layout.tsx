import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { InTabs } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { useSeedDummyExams } from '@/db/dev/useSeedDummyExams';
import { useSeedDummyProgress } from '@/db/dev/useSeedDummyProgress';
import { useSeedDummyTopics } from '@/db/dev/useSeedDummyTopics';
import { useCreditsHousekeeping } from '@/features/credits/hooks/useCreditsHousekeeping';
import { useExamHousekeeping } from '@/features/exams/hooks/useExamHousekeeping';

/** gradely-app's tabs: its own bar, and Settings opened from the picture in each tab's header. */
export default function TabsLayout() {
  // Development with the dummy API only: puts dummy topics on the phone. Remove all three with src/db/dev.
  useSeedDummyTopics();
  useSeedDummyExams();
  useSeedDummyProgress();
  useExamHousekeeping();
  useCreditsHousekeeping();
  return (
    // `InTabs` tells `Screen` it is a tab, so it leaves the bottom inset to the tab bar.
    <InTabs.Provider value>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, freezeOnBlur: true }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="topics" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="credits" />
      </Tabs>
    </InTabs.Provider>
  );
}
