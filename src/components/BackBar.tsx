import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { color, font, radius } from '@/theme/theme';
import { Icon, IconName } from './Icon';

/**
 * The bar every pushed screen opens with: a back control on the left and an
 * optional action on the right.
 *
 * Both controls are drawn as surfaces rather than bare glyphs — a loose chevron
 * and a loose trio of dots read as decoration at a glance, and at 20px with
 * muted ink they were easy to miss entirely. Each is 40pt tall with hitSlop on
 * top, comfortably past the 44pt/48dp minimum touch target on both platforms.
 */
export function BackBar({
  label,
  trailing,
  onPress,
  chevron = true,
}: {
  label: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  /**
   * Off for a control that sits where Back sits but does not go back — setup's
   * first step, where the only way out is cancelling it. A chevron there
   * promises one step back and delivers a sign-out.
   */
  chevron?: boolean;
}) {
  // Deep links can land on a screen with nothing beneath it, so fall back to the tabs.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  return (
    <View style={styles.row}>
      <Pressable
        android_ripple={{ color: color.ripple }}
        style={({ pressed }) => [styles.back, !chevron && styles.backPlain, pressed && IOS && styles.backPressed]}
        onPress={onPress ?? goBack}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={!chevron || label.toLowerCase() === 'back' ? label : `Back to ${label}`}
      >
        {chevron && <Icon name="chevronLeft" size={22} color={color.primary} />}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <View style={{ flex: 1 }} />
      {trailing}
    </View>
  );
}

/**
 * The right-hand control on a BackBar. Takes an icon or a short word, and gives
 * either one the same tappable surface so it is obvious it can be pressed.
 */
export function BarAction({
  icon,
  label,
  onPress,
  tone = 'ink',
  accessibilityLabel,
}: {
  icon?: IconName;
  label?: string;
  onPress?: () => void;
  tone?: 'ink' | 'primary';
  accessibilityLabel?: string;
}) {
  const tint = tone === 'primary' ? color.primary : color.ink;
  return (
    <Pressable
      android_ripple={{ color: color.ripple }}
      style={({ pressed }) => [icon ? styles.actionRound : styles.actionPill, pressed && IOS && styles.actionPressed]}
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {icon ? (
        <Icon name={icon} size={20} color={tint} />
      ) : (
        <Text style={[styles.actionLabel, { color: tint }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const CONTROL = 40;
// Android answers a press with Material's ripple, iOS by dimming.
const IOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
    height: CONTROL,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: radius.field,
    overflow: 'hidden',
  },
  backPlain: { paddingLeft: 12 },
  backPressed: { opacity: 0.6 },
  label: { fontFamily: font.eyebrow, fontSize: 14.5, color: color.primary, flexShrink: 1 },
  actionRound: {
    width: CONTROL,
    height: CONTROL,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.line,
    overflow: 'hidden',
  },
  actionPill: {
    height: CONTROL,
    paddingHorizontal: 16,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.line,
    overflow: 'hidden',
  },
  actionPressed: { opacity: 0.6 },
  actionLabel: { fontFamily: font.eyebrow, fontSize: 14.5 },
});
