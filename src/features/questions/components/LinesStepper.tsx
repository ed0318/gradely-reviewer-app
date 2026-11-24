import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';
import { fieldLabelStyle } from './LabeledField';
import { MAX_LINES, MIN_LINES } from '../questionRules';

/** LINES FOR THE ANSWER: how many ruled lines an essay's answer gets on paper. */
export function LinesStepper({ lines, onChangeLines }: { lines: number; onChangeLines: (lines: number) => void }) {
  return (
    <View>
      <Text style={styles.label}>LINES FOR THE ANSWER</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChangeLines(lines - 1)}
          disabled={lines <= MIN_LINES}
          hitSlop={4}
          style={[styles.button, lines <= MIN_LINES && styles.off]}
          accessibilityRole="button"
          accessibilityLabel="Fewer lines"
          accessibilityState={{ disabled: lines <= MIN_LINES }}
        >
          <Text style={styles.glyph}>−</Text>
        </Pressable>
        <Text style={styles.value} accessibilityLabel={`${lines} lines`}>
          {lines}
        </Text>
        <Pressable
          onPress={() => onChangeLines(lines + 1)}
          disabled={lines >= MAX_LINES}
          hitSlop={4}
          style={[styles.button, lines >= MAX_LINES && styles.off]}
          accessibilityRole="button"
          accessibilityLabel="More lines"
          accessibilityState={{ disabled: lines >= MAX_LINES }}
        >
          <Text style={styles.glyph}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: fieldLabelStyle,
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  button: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.4 },
  glyph: { fontFamily: font.ui, fontSize: 22, color: color.primary, lineHeight: 26 },
  value: { fontFamily: font.mono, fontSize: 18, color: color.ink, minWidth: 28, textAlign: 'center' },
});
