import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { BackBar } from '@/components/BackBar';
import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { DevOfflineSwitch } from '@/features/account/components/settings/DevOfflineSwitch';
import { SettingsRows } from '@/features/account/components/settings/SettingsRows';
import { SettingsSection } from '@/features/account/components/settings/SettingsSection';
import { useSignOut } from '@/features/account/hooks/useSignOut';
import { INSTALLED_APP_VERSION } from '@/features/account/hooks/useRequiredUpdate';
import { resolvePhotoUri } from '@/features/account/profilePhoto';
import { LowCreditThresholdField } from '@/features/credits/components/LowCreditThresholdField';
import { useLowCreditAlert } from '@/features/credits/hooks/useLowCreditAlert';
import { formatCredits } from '@/lib/creditUnits';
import { buildFullName, buildInitials } from '@/lib/personName';
import { useSignedInSession } from '@/state/AccountProvider';
import { useCredits } from '@/state/CreditsProvider';
import { color, font, radius, space } from '@/theme/theme';

/** gradely-app's Settings: the profile card, the account rows, folded groups, then Logout. */
export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useSignedInSession();
  const { balanceUnits } = useCredits();
  const alert = useLowCreditAlert();
  const signOut = useSignOut();
  const fullName = buildFullName(profile.firstName, profile.lastName);

  return (
    <Screen>
      <BackBar label="Back" />
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.profileCard} onPress={() => router.push('/settings/profile')} accessibilityRole="button" accessibilityLabel={`Your profile: ${fullName}`}>
          <Avatar uri={resolvePhotoUri(profile.photoPath) ?? undefined} initials={buildInitials(profile.firstName, profile.lastName)} size={46} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileMeta} numberOfLines={1}>
              {profile.email}
            </Text>
          </View>
          <Icon name="chevronRight" size={19} color={color.chevron} />
        </Pressable>

        <Card style={styles.group}>
          <SettingsRows
            rows={[{ icon: 'credits', label: 'Credits & history', value: balanceUnits === null ? '–' : formatCredits(balanceUnits), onPress: () => router.push('/credits/history') }]}
          />
        </Card>

        <Eyebrow label="SETTINGS" />
        {alert.isLoaded && (
          <SettingsSection
            icon="bell"
            title="Notifications"
            summary={alert.isOn ? `Low credits alert below ${alert.thresholdText} credits` : 'Low credits alert off'}
            rows={[
              {
                icon: 'credits',
                label: 'Low credits alert',
                hint: 'A notification on this phone when you run low.',
                trailing: <Switch value={alert.isOn} onValueChange={alert.toggle} accessibilityLabel="Low credits alert" trackColor={{ true: color.primary }} />,
              },
              ...(alert.isOn
                ? [
                    {
                      icon: 'edit' as const,
                      label: 'Alert me below',
                      trailing: <LowCreditThresholdField value={alert.thresholdText} onChangeText={alert.setThresholdText} onCommit={alert.saveThresholdText} />,
                    },
                  ]
                : []),
              { icon: 'clock', label: 'Exam reminders', hint: 'Each exam keeps its own reminder. Set it when you schedule the exam.' },
            ]}
          />
        )}

        <DevOfflineSwitch />

        <View style={styles.logoutRule} />
        <Pressable style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]} onPress={signOut} accessibilityRole="button">
          <Text style={styles.logoutLabel}>Logout</Text>
        </Pressable>
        <Text style={styles.version}>Gradely Reviewer · v{INSTALLED_APP_VERSION}</Text>
      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: 14 },
  title: { fontFamily: font.title, fontSize: 30, letterSpacing: -0.6, color: color.ink },
  content: { paddingHorizontal: space.gutter, paddingBottom: 32 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    paddingHorizontal: 18,
    marginBottom: space.section,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: { fontFamily: font.rowTitle, fontSize: 16, color: color.ink },
  profileMeta: { fontFamily: font.rowSubtitle, fontSize: 12, color: color.inkMuted, marginTop: 3 },
  group: { marginBottom: space.section },
  logoutRule: { height: 1, backgroundColor: color.line, marginHorizontal: -space.gutter, marginTop: space.section - 10, marginBottom: space.section },
  logout: { height: 50, borderRadius: radius.card, backgroundColor: color.rustTint, alignItems: 'center', justifyContent: 'center' },
  logoutLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.rust },
  version: { textAlign: 'center', fontFamily: font.uiRegular, fontSize: 11.5, color: color.inkMuted, marginTop: 14 },
});
