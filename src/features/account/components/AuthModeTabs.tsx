import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';

export type AuthMode = 'login' | 'signup';

const MODE_LABELS: Record<AuthMode, string> = { login: 'Log in', signup: 'Create account' };

/** The Log in / Create account switch at the top of the form. */
export function AuthModeTabs({ mode, onChange, isDisabled }: { mode: AuthMode; onChange: (mode: AuthMode) => void; isDisabled: boolean }) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {(Object.keys(MODE_LABELS) as AuthMode[]).map((option) => {
        const isSelected = option === mode;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            disabled={isDisabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
            style={[styles.segment, isSelected && styles.selected]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{MODE_LABELS[option]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: radius.field, backgroundColor: color.field },
  segment: { flex: 1, minHeight: 44, borderRadius: radius.field, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  label: { fontFamily: font.ui, fontSize: 13, color: color.inkMuted },
  selectedLabel: { color: color.ink },
});
