import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/Icon';
import { color, font } from '@/theme/theme';

const tabIcon = (name: IconName) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Icon name={name} color={focused ? color.primary : color.inkMuted} />;
  };

/** Home, Topics, Progress, Credits, as in the mockup's bottom bar. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.inkMuted,
        tabBarLabelStyle: { fontFamily: font.uiBold, fontSize: 11 },
        tabBarStyle: { borderTopColor: color.line, backgroundColor: color.surface },
        sceneStyle: { backgroundColor: color.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="topics" options={{ title: 'Topics', tabBarIcon: tabIcon('topics') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: tabIcon('progress') }} />
      <Tabs.Screen name="credits" options={{ title: 'Credits', tabBarIcon: tabIcon('credits') }} />
    </Tabs>
  );
}
