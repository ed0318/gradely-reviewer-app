import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import type { UpNextAttempt } from '@/db/repositories/attempts';
import { color, font, radius } from '@/theme/theme';
import { formatScheduledAt } from '../formatExam';

const WHEN: Record<UpNextAttempt['status'], (upNext: UpNextAttempt) => string> = {
  in_progress: () => 'IN PROGRESS',
  ready: () => 'READY TO START',
  scheduled: (upNext) => `UP NEXT · ${formatScheduledAt(upNext.scheduledAt).toUpperCase()}`,
};

/** "UP NEXT · Wed, Nov 26 · 7:00 PM — Numerical drill #5 · 30 items" with Start (Resume for one begun). */
export function UpNextCard({ upNext }: { upNext: UpNextAttempt }) {
  const action = upNext.status === 'in_progress' ? 'Resume' : 'Start';
  const open = () => router.push({ pathname: '/exam/[id]/take', params: { id: upNext.attemptId } });
  return (
    <Pressable onPress={open} style={styles.root} accessibilityRole="button" accessibilityLabel={`${WHEN[upNext.status](upNext)}: ${upNext.examName}, ${upNext.itemCount} items. ${action}`}>
      <Icon name="event" color={color.clay} />
      <View style={styles.words}>
        <Text style={styles.eyebrow}>{WHEN[upNext.status](upNext)}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {upNext.examName} · {upNext.itemCount} items
        </Text>
      </View>
      <View style={styles.button}>
        <Text style={styles.buttonLabel}>{action}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.card, backgroundColor: color.clayTint, borderWidth: 1, borderColor: '#EADCBE' },
  words: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.clay },
  title: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
  button: { minHeight: 34, paddingHorizontal: 12, borderRadius: radius.field, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontFamily: font.eyebrow, fontSize: 13, color: color.onPrimary },
});
