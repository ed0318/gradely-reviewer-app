import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';

/** True or false: two big buttons. The answer is 'true' or 'false'. */
export function TrueFalseAnswer({ selected, onChoose }: { selected: string | null; onChoose: (value: string) => void }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="True or false" style={styles.row}>
      {(['true', 'false'] as const).map((value) => {
        const isOn = selected === value;
        return (
          <Pressable key={value} onPress={() => onChoose(value)} accessibilityRole="radio" accessibilityState={{ checked: isOn }} style={[styles.button, isOn && styles.buttonOn]}>
            <Text style={[styles.label, isOn && styles.labelOn]}>{value === 'true' ? 'True' : 'False'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  buttonOn: { borderWidth: 2, borderColor: color.primary, backgroundColor: color.primaryTint },
  label: { fontFamily: font.title, fontSize: 22, color: color.ink },
  labelOn: { color: color.primary },
});
