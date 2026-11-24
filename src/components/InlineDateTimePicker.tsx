import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { color, radius } from '@/theme/theme';

type Props = {
  mode: 'date' | 'time';
  value: Date;
  onChange: (value: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
};

/**
 * The platform's own date or time picker. Android shows it as its own dialog,
 * so it is mounted only while open and closes itself once a value is set. iOS
 * draws it as a view: a date as the calendar (a tapped day is a whole answer, so
 * it closes), a time as wheels (which report every stop, so they stay open).
 */
export function InlineDateTimePicker({ mode, value, onChange, onClose, minimumDate }: Props) {
  const handleValue = (_event: unknown, picked: Date) => {
    onChange(picked);
    if (Platform.OS === 'android' || mode === 'date') onClose();
  };
  return (
    <View style={Platform.OS === 'ios' ? styles.iosWell : undefined}>
      <DateTimePicker
        value={value}
        mode={mode}
        display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
        accentColor={color.primary}
        onValueChange={handleValue}
        onDismiss={onClose}
        minimumDate={minimumDate}
        themeVariant="light"
        style={Platform.OS === 'ios' && mode === 'time' ? styles.iosWheels : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iosWell: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.field, overflow: 'hidden' },
  iosWheels: { height: 168 },
});
