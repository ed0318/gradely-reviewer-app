import React, { useEffect } from 'react';
// The dummy API's storage, before anything sends a request (only when EXPO_PUBLIC_API_MOCK is on).
import '@/api/mock/setupMockServer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Splash } from '@/components/Splash';
import { StartupError } from '@/components/StartupError';
import { RequiredUpdate } from '@/features/account/components/RequiredUpdate';
import { useRequiredUpdate } from '@/features/account/hooks/useRequiredUpdate';
import { AccountProvider, useAccount } from '@/state/AccountProvider';
import { CreditsProvider } from '@/state/CreditsProvider';
import { useDatabaseReady } from '@/state/useDatabaseReady';
import { useFontsReady } from '@/theme/useFontsReady';
import { color } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const areFontsReady = useFontsReady();
  const { status: databaseStatus, retryOpen } = useDatabaseReady();

  // The native splash lifts once the faces can draw; the drawn Splash takes over until the session is read.
  useEffect(() => {
    if (areFontsReady) void SplashScreen.hideAsync();
  }, [areFontsReady]);

  if (!areFontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {databaseStatus === 'opening' && <Splash />}
        {databaseStatus === 'failed' && <StartupError message="Your reviewer data could not be opened on this phone." onRetry={retryOpen} />}
        {databaseStatus === 'ready' && (
          <CreditsProvider>
            <AccountProvider>
              <RootNavigator />
            </AccountProvider>
          </CreditsProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Which part of the app may show: sign-in when signed out, only the hand-over
 * when another person's reviewers are on the phone, setup until the account
 * has a name, then the app.
 * Protected groups mean no deep link or back gesture reaches the wrong one.
 */
function RootNavigator() {
  const { session } = useAccount();
  const requiredUpdate = useRequiredUpdate();

  if (session.kind === 'loading' || requiredUpdate.kind === 'checking') return <Splash />;
  if (requiredUpdate.kind === 'required') return <RequiredUpdate minimumVersion={requiredUpdate.minimumVersion} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }}>
      <Stack.Protected guard={session.kind === 'signed_out'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={session.kind === 'handover'}>
        <Stack.Screen name="handover" />
      </Stack.Protected>
      <Stack.Protected guard={session.kind === 'onboarding'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={session.kind === 'signed_in'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="topic/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="question/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="credits/history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="exam/new" options={{ animation: 'slide_from_right' }} />
        {/* No swipe-back mid-exam: Quit asks first. */}
        <Stack.Screen name="exam/[id]/take" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        <Stack.Screen name="exam/[id]/results" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>
    </Stack>
  );
}
