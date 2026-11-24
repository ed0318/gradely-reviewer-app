import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

const WORKS_OFFLINE = ['Topics and questions', 'Taking exams you already made', 'Progress and past answers'];
const NEEDS_INTERNET = ['New exams and retakes', 'Buying credits'];

type Props = { reason: 'offline' | 'unavailable'; isRetrying: boolean; onTryAgain: () => void; onKeepOffline: () => void };

/**
 * Mockup 12. The attempt is saved and will be tried again with the same key,
 * so "Keep reviewing offline" does not lose it and a retry never charges twice.
 */
export function OfflineChargeSheet({ reason, isRetrying, onTryAgain, onKeepOffline }: Props) {
  const isOffline = reason === 'offline';
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Icon name="wifi" size={20} color={color.clay} />
        </View>
        <Text style={styles.eyebrow}>{isOffline ? 'NO INTERNET' : 'SERVER NOT ANSWERING'}</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {isOffline ? 'Connect to create an exam.' : "Couldn't reach the server."}
      </Text>
      <Text style={styles.body}>
        Credits come off your account the moment an exam is made, so this needs internet. Your exam is saved and will be made as soon as you are back online. You will not be charged twice.
      </Text>
      <View style={styles.table}>
        <Column heading="WORKS OFFLINE" headingColor={color.ok} items={WORKS_OFFLINE} hasDivider />
        <Column heading="NEEDS INTERNET" headingColor={color.dangerInk} items={NEEDS_INTERNET} />
      </View>
      <Button label="Try again" onPress={onTryAgain} isBusy={isRetrying} />
      <Button variant="quiet" label="Keep reviewing offline" onPress={onKeepOffline} />
    </View>
  );
}

function Column({ heading, headingColor, items, hasDivider }: { heading: string; headingColor: string; items: string[]; hasDivider?: boolean }) {
  return (
    <View style={[styles.column, hasDivider && styles.columnDivider]}>
      <Text style={[styles.columnHead, { color: headingColor }]}>{heading}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.item}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 22 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: color.clayTint, borderWidth: 1, borderColor: '#EADCBE' },
  eyebrow: { fontFamily: font.eyebrow, fontSize: 12, letterSpacing: 1, color: color.clay },
  title: { fontFamily: font.title, fontSize: 26, lineHeight: 30, color: color.ink },
  body: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted },
  table: { flexDirection: 'row', borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden' },
  column: { flex: 1 },
  columnDivider: { borderRightWidth: 1, borderRightColor: color.rule },
  columnHead: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.6, padding: 8, paddingHorizontal: 12, backgroundColor: color.paper },
  item: { fontFamily: font.uiRegular, fontSize: 13, lineHeight: 18, padding: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: color.rule, color: color.ink },
});
