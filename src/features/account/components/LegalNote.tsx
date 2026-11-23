import React from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import { PRIVACY_URL, TERMS_URL } from '@/config/site';
import { color, font } from '@/theme/theme';

/** Both stores want the terms and privacy policy reachable before an account is made. */
export function LegalNote() {
  return (
    <Text style={styles.text}>
      By continuing you agree to the{' '}
      <Text style={styles.link} accessibilityRole="link" onPress={() => void Linking.openURL(TERMS_URL)}>
        Terms
      </Text>{' '}
      and{' '}
      <Text style={styles.link} accessibilityRole="link" onPress={() => void Linking.openURL(PRIVACY_URL)}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { textAlign: 'center', fontFamily: font.uiRegular, fontSize: 12, lineHeight: 17, color: color.inkMuted, marginTop: 26 },
  link: { textDecorationLine: 'underline', color: color.ink },
});
