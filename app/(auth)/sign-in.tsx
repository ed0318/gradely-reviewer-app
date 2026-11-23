import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { PaperScreen } from '@/components/PaperScreen';
import { TextField } from '@/components/TextField';
import { ProviderButtons } from '@/features/account/components/ProviderButtons';
import { SignInHero } from '@/features/account/components/SignInHero';
import { useSignIn } from '@/features/account/hooks/useSignIn';
import { color, font } from '@/theme/theme';

/** Mockup screen 1: Apple, Google, or email and password. */
export default function SignInScreen() {
  const signIn = useSignIn();
  const hasProviders = signIn.isAppleAvailable || signIn.isGoogleAvailable;

  return (
    <PaperScreen
      footer={
        <>
          <Button label="Sign in" onPress={signIn.submitEmail} isBusy={signIn.busyMethod === 'email'} isDisabled={!signIn.canSubmitEmail} />
          <Link href="/create-account" asChild>
            <Pressable accessibilityRole="link" style={styles.createLink}>
              <Text style={styles.createText}>
                New here? <Text style={styles.createAction}>Create an account</Text>
              </Text>
            </Pressable>
          </Link>
        </>
      }
    >
      <SignInHero title="Make your own reviewer. Take it again and again." subtitle="Your topics and questions stay on this phone." />
      <ProviderButtons
        isAppleAvailable={signIn.isAppleAvailable}
        isGoogleAvailable={signIn.isGoogleAvailable}
        busyMethod={signIn.busyMethod}
        onApple={signIn.signInWithApple}
        onGoogle={signIn.signInWithGoogle}
      />
      {hasProviders && (
        <View style={styles.divider} accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={styles.rule} />
          <Text style={styles.dividerText}>or use your email</Text>
          <View style={styles.rule} />
        </View>
      )}
      <TextField
        label="Email"
        value={signIn.email}
        onChangeText={signIn.setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        value={signIn.password}
        onChangeText={signIn.setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={signIn.submitEmail}
      />
      <Link href="/forgot-password" asChild>
        <Pressable accessibilityRole="link" style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
      </Link>
      <FormMessage text={signIn.errorMessage} />
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1, backgroundColor: color.line },
  dividerText: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  forgotText: { fontFamily: font.rowTitle, fontSize: 13, color: color.primary },
  createLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  createText: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
  createAction: { color: color.primary, textDecorationLine: 'underline' },
});
