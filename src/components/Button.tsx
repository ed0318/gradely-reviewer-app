import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE, RIPPLE_ON_PRIMARY } from '@/theme/press';
import { color, font, radius } from '@/theme/theme';

export type ButtonVariant = 'primary' | 'danger' | 'outline' | 'quiet' | 'black' | 'white';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isBusy?: boolean;
  isDisabled?: boolean;
  /** Spoken instead of `label` when the label alone is unclear. */
  accessibilityLabel?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Full-width action, 52 pt tall (44 pt for `quiet`), as in the mockup. */
export function Button({ label, onPress, variant = 'primary', isBusy = false, isDisabled = false, accessibilityLabel, leading, trailing, style }: ButtonProps) {
  const isInactive = isDisabled || isBusy;
  const look = VARIANT_LOOKS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: isBusy }}
      android_ripple={look.isDark ? RIPPLE_ON_PRIMARY : RIPPLE}
      style={({ pressed }) => [
        styles.base,
        variant === 'quiet' ? styles.quiet : styles.solid,
        look.container,
        isDisabled && !isBusy && styles.disabled,
        IOS && pressed && IOS_DIM,
        style,
      ]}
    >
      {isBusy ? (
        <ActivityIndicator color={look.labelColor} />
      ) : (
        <>
          {leading}
          <Text style={[styles.label, { color: isDisabled ? color.inkMuted : look.labelColor }]}>{label}</Text>
          {!isDisabled && trailing}
        </>
      )}
    </Pressable>
  );
}

const VARIANT_LOOKS: Record<ButtonVariant, { container: ViewStyle; labelColor: string; isDark: boolean }> = {
  primary: { container: { backgroundColor: color.primary }, labelColor: color.onPrimary, isDark: true },
  danger: { container: { backgroundColor: color.rust }, labelColor: color.onPrimary, isDark: true },
  black: { container: { backgroundColor: '#000000' }, labelColor: '#FFFFFF', isDark: true },
  outline: { container: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.primary }, labelColor: color.primary, isDark: false },
  white: { container: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.fieldBorder }, labelColor: color.ink, isDark: false },
  quiet: { container: {}, labelColor: color.inkMuted, isDark: false },
};

const styles = StyleSheet.create({
  base: {
    ...PRESS_CLIP,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    paddingHorizontal: 16,
  },
  solid: { minHeight: 52 },
  quiet: { minHeight: 44 },
  disabled: { backgroundColor: color.line, borderColor: color.line },
  label: { fontFamily: font.rowTitle, fontSize: 15 },
});
