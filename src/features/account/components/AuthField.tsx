import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

type AuthFieldProps = Omit<TextInputProps, 'style' | 'placeholder' | 'secureTextEntry'> & {
  icon: IconName;
  /** The placeholder, and the field's accessible name. */
  label: string;
  /** A password: hidden, with gradely-app's Show / Hide. */
  isSecret?: boolean;
};

/** gradely-app's sign-in field: an icon, the input, and Show / Hide for a password. */
export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField({ icon, label, isSecret = false, value, ...inputProps }, ref) {
  const [isShown, setIsShown] = useState(false);
  return (
    <View style={styles.field}>
      <Icon name={icon} size={19} color={color.inkMuted} />
      <TextInput
        ref={ref}
        value={value}
        placeholder={label}
        accessibilityLabel={label}
        placeholderTextColor={color.inkMuted}
        secureTextEntry={isSecret && !isShown}
        style={[styles.input, isSecret && !!value && styles.mono]}
        {...inputProps}
      />
      {isSecret && (
        <Pressable
          onPress={() => setIsShown((shown) => !shown)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isShown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          style={styles.toggle}
        >
          <Text style={styles.toggleLabel}>{isShown ? 'Hide' : 'Show'}</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.surface,
  },
  input: { flex: 1, height: '100%', fontFamily: font.uiRegular, fontSize: 14.5, color: color.ink },
  mono: { fontFamily: font.mono, letterSpacing: 1 },
  toggle: { minHeight: 44, justifyContent: 'center' },
  toggleLabel: { fontFamily: font.eyebrow, fontSize: 12.5, color: color.primary },
});
