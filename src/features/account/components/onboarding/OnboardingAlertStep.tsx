import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InfoNote } from '@/components/InfoNote';
import { formatCredits, UNITS_PER_EXAM_ITEM } from '@/lib/creditUnits';
import { color, font } from '@/theme/theme';
import type { useOnboarding } from '../../hooks/useOnboarding';
import { onboardingStyles } from './onboardingStyles';

/** Step 2: the low-credit alert, asked before it matters, as gradely-app asks about backups. */
export function OnboardingAlertStep({ onboarding }: { onboarding: ReturnType<typeof useOnboarding> }) {
  return (
    <>
      <Text style={onboardingStyles.title} accessibilityRole="header">
        Stay ahead of your credits
      </Text>
      <Text style={onboardingStyles.subtitle}>
        Writing topics and questions is free. Each exam costs {formatCredits(UNITS_PER_EXAM_ITEM)} credit per item, so the app can tell you before you
        run low.
      </Text>

      <View style={styles.head}>
        <Text style={onboardingStyles.label}>LOW CREDITS ALERT</Text>
        <Pressable
          onPress={onboarding.toggleAlert}
          hitSlop={10}
          accessibilityRole="switch"
          accessibilityLabel="Low credits alert"
          accessibilityState={{ checked: onboarding.isAlertOn }}
          style={styles.toggle}
        >
          <Text style={styles.toggleLabel}>{onboarding.isAlertOn ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
      <View style={[onboardingStyles.card, styles.card]}>
        {onboarding.isAlertOn ? (
          <View style={styles.thresholdRow}>
            <Text style={styles.cardText}>Alert me below</Text>
            <TextInput
              value={onboarding.alertCreditsText}
              onChangeText={onboarding.setAlertCreditsText}
              keyboardType="number-pad"
              accessibilityLabel="Alert below this many credits"
              style={styles.threshold}
            />
            <Text style={styles.cardText}>credits</Text>
          </View>
        ) : (
          <Text style={styles.cardText}>Off. You can turn it on any time in Settings.</Text>
        )}
      </View>

      <View style={onboardingStyles.noteTop}>
        <InfoNote text="The alert is a notification on this phone only. Each exam you schedule also gets its own reminder." />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline' },
  toggle: { marginLeft: 'auto', minHeight: 44, justifyContent: 'center' },
  toggleLabel: { fontFamily: font.eyebrow, fontSize: 12.5, color: color.primary },
  card: { padding: 14 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardText: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  threshold: {
    width: 64,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    backgroundColor: color.surface,
    textAlign: 'center',
    fontFamily: font.monoStrong,
    fontSize: 15,
    color: color.ink,
  },
});
