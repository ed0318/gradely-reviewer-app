import React, { useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { color, font } from '@/theme/theme';
import { Icon, IconName } from './Icon';
import { useLayout } from '@/layout/useLayout';

const ICONS: Record<string, IconName> = {
  index: 'home',
  topics: 'topics',
  progress: 'progress',
  credits: 'credits',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  topics: 'Topics',
  progress: 'Progress',
  credits: 'Credits',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tablet } = useLayout();
  // Out of the way while typing. Android resizes the window for the keyboard,
  // so the bar rode on top of it and left a sliver for the results of a search
  // on a mid-range phone. On iOS the keyboard covers the bar already.
  const typing = useKeyboardShownOnAndroid();
  // Built again when the system text size changes, as every screen is (see
  // `Screen`): otherwise the labels keep the widths they were measured at.
  const { fontScale } = useWindowDimensions();
  if (typing) return null;
  return (
    <View key={fontScale}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* The bar itself spans the window; its five items do not. Spread across
            an iPad they would sit hundreds of points apart. */}
        <View style={[styles.items, tablet && styles.itemsTablet]} accessibilityRole="tablist">
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            return (
              <TabItem
                key={route.key}
                focused={focused}
                icon={ICONS[route.name] ?? 'home'}
                label={LABELS[route.name] ?? route.name}
                onPress={() => {
                  // Emitted on every press, the open tab included: a press on
                  // the tab already showing is how a screen knows to scroll
                  // back to the top (useScrollToTop listens for it).
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function useKeyboardShownOnAndroid(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setShown(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return shown;
}

/**
 * One tab, marked the way a ledger's index tab is: a navy rule across the top of
 * the open one. The rule eases in rather than jumping, which is the only motion
 * here.
 */
function TabItem({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, on]);
  const indicator = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scaleX: 0.4 + on.value * 0.6 }] }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      // Android: a round ripple about the icon, as Material's navigation bar
      // has; iOS dims the tab instead.
      android_ripple={{ color: color.ripple, borderless: true, radius: 30 }}
      style={({ pressed }) => [styles.item, pressed && Platform.OS === 'ios' && styles.itemPressed]}
    >
      <Animated.View style={[styles.indicator, indicator]} />
      <View style={styles.iconWrap}>
        <Icon name={icon} size={19} color={focused ? color.primary : color.inkMuted} />
      </View>
      {/* Capped at 1.3×: five labels share the width, and past that they are cut
          short. The full name is still what is read out. */}
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingHorizontal: 6,
  },
  items: { flexDirection: 'row' },
  itemsTablet: { alignSelf: 'center', width: '100%', maxWidth: 760 },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 9, minHeight: 52 },
  itemPressed: { opacity: 0.6 },
  indicator: { position: 'absolute', top: -1, left: 6, right: 6, height: 3, backgroundColor: color.primary },
  iconWrap: { width: 46, height: 24, alignItems: 'center', justifyContent: 'center' },
  // One size whether open or not, so the row doesn't shift; the open tab is
  // told apart by weight and colour.
  label: { fontFamily: font.ui, fontSize: 11.5, color: color.inkMuted },
  labelActive: { fontFamily: font.heading, color: color.primary },
});
