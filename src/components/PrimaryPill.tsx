import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon, IconName } from './Icon';

type Props = {
  /** Left out for an icon-only pill, which then needs `accessibilityLabel`. */
  label?: string;
  /** What a screen reader says. Defaults to the label. */
  accessibilityLabel?: string;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  tone?: 'navy' | 'ghost' | 'sheet';
  style?: any;
};

export function PrimaryPill({ label, accessibilityLabel, icon, iconPosition = 'left', onPress, tone = 'navy', style }: Props) {
  const isNavy = tone === 'navy';
  const iconColor = isNavy ? color.onPrimary : tone === 'sheet' ? color.ink : color.primary;
  const textColor = isNavy ? color.onPrimary : tone === 'sheet' ? color.ink : color.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      // Drawn 38 tall; the touch reaches 50, past the 44pt / 48dp minimum.
      hitSlop={6}
      // Android answers a press with Material's ripple, iOS with a dip.
      android_ripple={{ color: isNavy ? color.rippleOnPrimary : color.ripple }}
      style={({ pressed }) => [
        styles.base,
        isNavy && { backgroundColor: color.primary, borderColor: color.primary },
        tone === 'ghost' && { backgroundColor: 'transparent', borderColor: 'transparent' },
        tone === 'sheet' && { backgroundColor: color.paper },
        !label && styles.iconOnly,
        pressed && IOS && styles.pressed,
        style,
      ]}
    >
      {icon && iconPosition === 'left' && <Icon name={icon} size={17} color={iconColor} />}
      {!!label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
      {icon && iconPosition === 'right' && <Icon name={icon} size={17} color={iconColor} />}
    </Pressable>
  );
}

const IOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    // Centred when it is stretched across a sheet.
    justifyContent: 'center',
    gap: 6,
    // A floor, not a size: at large text the label needs more room than 38.
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    // Keeps the ripple inside the rounded corners.
    overflow: 'hidden',
  },
  // Square: as wide as it is tall.
  iconOnly: { paddingHorizontal: 10, minWidth: 38, justifyContent: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  label: {
    fontFamily: font.eyebrow,
    fontSize: 13,
  },
});
