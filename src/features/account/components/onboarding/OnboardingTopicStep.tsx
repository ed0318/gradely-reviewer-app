import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { buildFullName } from '@/lib/personName';
import { color, font } from '@/theme/theme';
import type { useOnboarding } from '../../hooks/useOnboarding';
import { onboardingStyles } from './onboardingStyles';

/** Step 3: an optional first topic, and what is being set up, as gradely-app's first class. */
export function OnboardingTopicStep({ onboarding }: { onboarding: ReturnType<typeof useOnboarding> }) {
  const summaryRows: Array<[string, string]> = [
    ['Name', buildFullName(onboarding.firstName, onboarding.lastName) || '—'],
    ['Credits alert', onboarding.isAlertOn ? `Below ${onboarding.alertCreditsText || '0'} credits` : 'Off'],
    ['First topic', onboarding.topicTitle.trim() || 'Later'],
  ];
  return (
    <>
      <Text style={onboardingStyles.title} accessibilityRole="header">
        Add your first topic
      </Text>
      <Text style={onboardingStyles.subtitle}>Optional. Skip it and add topics from the Topics tab whenever you are ready.</Text>

      <Text style={onboardingStyles.label}>TOPIC</Text>
      <TextInput
        value={onboarding.topicTitle}
        onChangeText={onboarding.setTopicTitle}
        placeholder="e.g. Civil Service — Numerical"
        placeholderTextColor={color.inkMuted}
        accessibilityLabel="Topic"
        style={onboardingStyles.input}
      />
      <Text style={[onboardingStyles.label, onboardingStyles.spacedTop]}>SUBJECT (OPTIONAL)</Text>
      <TextInput
        value={onboarding.topicSubject}
        onChangeText={onboarding.setTopicSubject}
        placeholder="e.g. Mathematics"
        placeholderTextColor={color.inkMuted}
        accessibilityLabel="Subject, optional"
        style={onboardingStyles.input}
      />

      <Text style={styles.summaryLabel}>YOU ARE SETTING UP</Text>
      <View style={[onboardingStyles.card, styles.summary]}>
        {summaryRows.map(([label, value], index) => (
          <View key={label} style={[styles.row, index > 0 && styles.rowRule]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {value}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryLabel: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginTop: 26, marginBottom: 9 },
  summary: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 46, paddingHorizontal: 18, paddingVertical: 10 },
  rowRule: { borderTopWidth: 1, borderTopColor: color.rule },
  rowLabel: { fontFamily: font.rowSubtitle, fontSize: 12.5, color: color.inkMuted, width: 96 },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: font.rowTitle, fontSize: 13.5, color: color.ink },
});
