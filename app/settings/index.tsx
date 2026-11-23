import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PaperScreen } from '@/components/PaperScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { DeleteAccountSection } from '@/features/account/components/DeleteAccountSection';
import { ProfileCard } from '@/features/account/components/ProfileCard';
import { useAccountExit } from '@/features/account/hooks/useAccountExit';
import { LowCreditAlertRow } from '@/features/credits/components/LowCreditAlertRow';
import { formatCredits } from '@/lib/creditUnits';
import { useCredits } from '@/state/CreditsProvider';
import { IOS, IOS_DIM } from '@/theme/press';
import { color, font, radius } from '@/theme/theme';

/** Mockup 13. Each exam's own reminder is listed here once scheduling exists (Phase 6). */
export default function SettingsScreen() {
  const router = useRouter();
  const { balanceUnits } = useCredits();
  const exit = useAccountExit();

  return (
    <PaperScreen isRuled={false}>
      <ScreenHeader title="Settings." onBack={router.back} />
      <ProfileCard />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        NOTIFICATIONS
      </Text>
      <View style={styles.group}>
        <LowCreditAlertRow />
      </View>
      <Text style={styles.note}>Each exam keeps its own reminder. Set it when you schedule the exam.</Text>

      <View style={styles.group}>
        <Pressable
          onPress={() => router.push('/credits')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, styles.rowDivider, IOS && pressed && IOS_DIM]}
        >
          <Text style={styles.rowLabel}>Credits &amp; history</Text>
          <Text style={styles.rowValue}>{balanceUnits === null ? '–' : formatCredits(balanceUnits)}</Text>
        </Pressable>
        <Pressable
          onPress={exit.signOut}
          disabled={exit.isSigningOut}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, IOS && pressed && IOS_DIM]}
        >
          <Text style={[styles.rowLabel, styles.danger]}>{exit.isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
      </View>

      <DeleteAccountSection exit={exit} />
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: font.eyebrow, fontSize: 12, letterSpacing: 1, color: color.inkMuted, marginTop: 6 },
  group: { borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden' },
  note: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50, paddingHorizontal: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: color.rule },
  rowLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
  rowValue: { fontFamily: font.mono, fontSize: 13, color: color.inkMuted },
  danger: { color: color.rust },
});
