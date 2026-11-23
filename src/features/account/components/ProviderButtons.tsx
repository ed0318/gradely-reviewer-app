import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { color, font, radius } from '@/theme/theme';
import type { SignInMethod } from '../hooks/useAuthForm';
import { GoogleMark } from '@/components/BrandMark';

type ProviderButtonsProps = {
  isAppleAvailable: boolean;
  isGoogleAvailable: boolean;
  busyMethod: SignInMethod | null;
  onApple: () => void;
  onGoogle: () => void;
};

/**
 * As in gradely-app: "or", then Apple's own button above Google's at the same
 * size (Apple's guidelines), and Google's four-colour mark on white.
 */
export function ProviderButtons({ isAppleAvailable, isGoogleAvailable, busyMethod, onApple, onGoogle }: ProviderButtonsProps) {
  if (!isAppleAvailable && !isGoogleAvailable) return null;
  const isBusy = busyMethod !== null;
  return (
    <>
      <View style={styles.dividerRow} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.buttons}>
        {isAppleAvailable && (
          // Apple's button has no disabled state, so the wrapper stands in for one.
          <View pointerEvents={isBusy ? 'none' : 'auto'} style={isBusy && styles.dimmed}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.field}
              style={styles.apple}
              onPress={onApple}
            />
          </View>
        )}
        {isGoogleAvailable && (
          <Pressable
            onPress={onGoogle}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: isBusy, busy: busyMethod === 'google' }}
            style={[styles.google, isBusy && styles.dimmed]}
          >
            {busyMethod === 'google' ? <ActivityIndicator color={color.primary} /> : <GoogleMark size={18} />}
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: color.rule },
  dividerLabel: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  buttons: { gap: 10 },
  apple: { width: '100%', height: 50 },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  googleLabel: { fontFamily: font.ui, fontSize: 14, color: color.ink },
  dimmed: { opacity: 0.45 },
});
