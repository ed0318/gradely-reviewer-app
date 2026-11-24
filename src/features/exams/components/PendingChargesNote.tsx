import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';
import type { usePendingCharges } from '../hooks/usePendingCharges';

/**
 * "1 exam is waiting for internet." An exam saved while offline is made, and its
 * credits taken once, the next time the server is reached; this lets the student
 * do that now. The same key is sent every time, so it never charges twice.
 */
export function PendingChargesNote({ pending }: { pending: ReturnType<typeof usePendingCharges> }) {
  if (pending.count === 0) return null;
  const words = pending.count === 1 ? '1 exam is waiting for internet' : `${pending.count} exams are waiting for internet`;
  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.head}>
        <Icon name="wifi" size={20} color={color.clay} />
        <View style={styles.words}>
          <Text style={styles.title}>{words}</Text>
          <Text style={styles.sub}>{pending.isStillOffline ? 'Still no answer from the server. Try again later.' : 'Credits are taken once, when it is made.'}</Text>
        </View>
      </View>
      <Button variant="outline" label="Try again" onPress={() => void pending.retryNow()} isBusy={pending.isRetrying} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, padding: 12, borderRadius: radius.card, backgroundColor: color.clayTint, borderWidth: 1, borderColor: '#EADCBE' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  words: { flex: 1, gap: 2 },
  title: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
  sub: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
