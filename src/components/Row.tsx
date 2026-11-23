import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon } from './Icon';
import { LARGE_TEXT } from '@/layout/useLayout';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE } from '@/theme/press';

type Props = {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  trailingText?: string;
  trailingTextColor?: string;
  /**
   * A shortcut on the right that is not the row's own tap.
   *
   * For a row that already leads somewhere but also offers one obvious next
   * step — a subject with no class yet, which opens its editor like every other
   * subject and can also start a class from here.
   */
  trailingAction?: { label: string; onPress: () => void };
  /** Anything richer than text at the end of the row: a grade, a remark. */
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  minHeight?: number;
  leading?: React.ReactNode;
};

export function Row({
  title,
  subtitle,
  subtitleColor = color.inkMuted,
  trailingText,
  trailingTextColor = color.ink,
  trailingAction,
  trailing,
  showChevron,
  onPress,
  minHeight = 60,
  leading,
}: Props) {
  // At large system text the trailing value kept its full width and the title
  // got what was left ("Subscription" became "S"). Past this scale the value
  // moves under the title and subtitle, and the title takes the whole width
  // and wraps. At ordinary sizes nothing changes.
  const large = useWindowDimensions().fontScale > LARGE_TEXT;
  const value = trailingText ? (
    <Text style={[styles.trailing, large && styles.trailingStacked, { color: trailingTextColor }]}>{trailingText}</Text>
  ) : null;
  const content = (
    <>
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={large ? 3 : 1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={large ? 3 : 1}>
            {subtitle}
          </Text>
        ) : null}
        {large && value}
      </View>
      {!large && value}
      {trailing}
      {trailingAction ? (
        <Pressable
          android_ripple={RIPPLE}
          style={({ pressed }) => [styles.action, PRESS_CLIP, IOS && pressed && IOS_DIM]}
          hitSlop={6}
          accessibilityRole="button"
          onPress={trailingAction.onPress}
        >
          <Text style={styles.actionLabel}>{trailingAction.label}</Text>
        </Pressable>
      ) : null}
      {showChevron && <Icon name="chevronRight" size={19} color={color.chevron} />}
    </>
  );
  if (!onPress) return <View style={[styles.row, { minHeight }]}>{content}</View>;
  // A tapped row takes the ruled paper's tint for as long as the finger is on
  // it on iOS; Android answers with Material's ripple instead.
  return (
    // A button to VoiceOver and TalkBack, which read out the text inside it.
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      android_ripple={{ color: color.ripple }}
      style={({ pressed }) => [styles.row, { minHeight }, pressed && Platform.OS === 'ios' && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pressed: { backgroundColor: color.paper },
  title: { fontFamily: font.rowTitle, fontSize: 14.5, color: color.ink },
  subtitle: { fontFamily: font.rowSubtitle, fontSize: 12.5, marginTop: 2 },
  trailing: { fontFamily: font.ui, fontSize: 12.5 },
  trailingStacked: { marginTop: 2 },
  action: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.field,
    backgroundColor: color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: font.eyebrow, fontSize: 12, color: color.primary },
});
