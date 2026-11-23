import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button } from '@/components/Button';
import { radius } from '@/theme/theme';
import type { SignInMethod } from '../hooks/useSignIn';
import { GoogleMark } from './GoogleMark';

type ProviderButtonsProps = {
  isAppleAvailable: boolean;
  isGoogleAvailable: boolean;
  busyMethod: SignInMethod | null;
  onApple: () => void;
  onGoogle: () => void;
};

/** "Continue with Apple" (Apple's own button, as App Review expects) and "Continue with Google". */
export function ProviderButtons({ isAppleAvailable, isGoogleAvailable, busyMethod, onApple, onGoogle }: ProviderButtonsProps) {
  if (!isAppleAvailable && !isGoogleAvailable) return null;
  return (
    <View style={styles.root}>
      {isAppleAvailable &&
        (busyMethod === 'apple' ? (
          <View style={[styles.appleBusy]}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.field}
            style={styles.apple}
            onPress={() => {
              if (busyMethod === null) onApple();
            }}
          />
        ))}
      {isGoogleAvailable && (
        <Button
          label="Continue with Google"
          variant="white"
          leading={<GoogleMark size={18} />}
          isBusy={busyMethod === 'google'}
          isDisabled={busyMethod !== null && busyMethod !== 'google'}
          onPress={onGoogle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  apple: { height: 50, width: '100%' },
  appleBusy: { height: 50, borderRadius: radius.field, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
});
