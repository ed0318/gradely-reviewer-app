import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import type { UpNextAttempt } from '@/db/repositories/attempts';
import { color, font, radius } from '@/theme/theme';

/** "UP NEXT · Wed, Nov 26 · 7:00 PM — Numerical drill #5 · 30 items". Starting it comes with Phase 6. */
export function UpNextCard({ upNext }: { upNext: UpNextAttempt }) {
  return (
    <View style={styles.root} accessible accessibilityLabel={`Up next, ${formatScheduledAt(upNext.scheduledAt)}: ${upNext.examName}, ${upNext.itemCount} items`}>
      <Icon name="calendar" color={color.clay} />
      <View style={styles.words}>
        <Text style={styles.eyebrow}>UP NEXT · {formatScheduledAt(upNext.scheduledAt).toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {upNext.examName} · {upNext.itemCount} items
        </Text>
      </View>
    </View>
  );
}

function formatScheduledAt(scheduledAt: number | null): string {
  if (scheduledAt === null) return 'Not scheduled';
  const when = new Date(scheduledAt);
  const day = when.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day} · ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.card, backgroundColor: color.clayTint, borderWidth: 1, borderColor: '#EADCBE' },
  words: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.clay },
  title: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
});
