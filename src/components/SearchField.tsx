import React from 'react';
import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { color, font, radius, space } from '@/theme/theme';
import { Icon } from './Icon';

export function SearchField({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.field, style]}>
      <Icon name="search" size={18} color={color.inkMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkMuted}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        autoFocus={autoFocus}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: radius.field,
    backgroundColor: color.field,
    paddingHorizontal: 15,
    marginHorizontal: space.gutter,
    marginBottom: 12,
  },
  input: { flex: 1, fontFamily: font.uiRegular, fontSize: 13.5, color: color.ink, padding: 0 },
});
