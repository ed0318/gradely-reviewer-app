import React from 'react';
import { Linking, Platform, StyleSheet, Text } from 'react-native';
import { AppIconTile } from '@/components/AppIconTile';
import { Button } from '@/components/Button';
import { AuthScreen } from '@/components/AuthScreen';
import { color, font } from '@/theme/theme';
import { INSTALLED_APP_VERSION } from '../hooks/useRequiredUpdate';

/** The App Store id is set once the listing exists; until then iOS opens the website. */
const STORE_URL = Platform.OS === 'android' ? 'market://details?id=ph.gradely.reviewer' : 'https://gradely.ph/reviewer';

/** Shown in place of the app when this version is below the server's minimum. */
export function RequiredUpdate({ minimumVersion }: { minimumVersion: string }) {
  return (
    <AuthScreen footer={<Button label="Update Gradely Reviewer" onPress={() => void Linking.openURL(STORE_URL)} />}>
      <AppIconTile size={52} />
      <Text style={styles.title} accessibilityRole="header">
        Time to update.
      </Text>
      <Text style={styles.body}>
        This version ({INSTALLED_APP_VERSION}) no longer works with your account. Update to version {minimumVersion} or newer to keep reviewing. Your
        topics and exams stay on this phone.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.title, fontSize: 30, color: color.ink },
  body: { fontFamily: font.uiRegular, fontSize: 15, lineHeight: 22, color: color.inkMuted },
});
