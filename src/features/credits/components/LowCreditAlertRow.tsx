import React from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { useLowCreditAlert } from '../hooks/useLowCreditAlert';

/** "Low credits alert — Alert me below [20] credits" with its switch. */
export function LowCreditAlertRow() {
  const alert = useLowCreditAlert();
  if (!alert.isLoaded) return null;
  return (
    <View style={styles.root}>
      <View style={styles.words}>
        <Text style={styles.title}>Low credits alert</Text>
        {alert.isOn ? (
          <View style={styles.thresholdRow}>
            <Text style={styles.hint}>Alert me below</Text>
            <TextInput
              value={alert.thresholdText}
              onChangeText={alert.setThresholdText}
              onEndEditing={alert.saveThreshold}
              keyboardType="number-pad"
              accessibilityLabel="Alert below this many credits"
              style={styles.threshold}
            />
            <Text style={styles.hint}>credits</Text>
          </View>
        ) : (
          <Text style={styles.hint}>Off</Text>
        )}
      </View>
      <Switch
        value={alert.isOn}
        onValueChange={alert.toggle}
        accessibilityLabel="Low credits alert"
        trackColor={{ true: color.primary, false: '#B9C3CF' }}
        thumbColor={color.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, paddingVertical: 8, paddingHorizontal: 14 },
  words: { flex: 1, gap: 4 },
  title: { fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hint: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  threshold: {
    width: 56,
    minHeight: 36,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.surface,
    textAlign: 'center',
    fontFamily: font.monoStrong,
    fontSize: 14,
    color: color.ink,
  },
});
