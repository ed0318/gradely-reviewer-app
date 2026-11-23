import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Icon } from '@/components/Icon';
import { Paper } from '@/components/Paper';
import { OnboardingAlertStep } from '@/features/account/components/onboarding/OnboardingAlertStep';
import { OnboardingProgress } from '@/features/account/components/onboarding/OnboardingProgress';
import { OnboardingTopicStep } from '@/features/account/components/onboarding/OnboardingTopicStep';
import { OnboardingWhoStep } from '@/features/account/components/onboarding/OnboardingWhoStep';
import { onboardingStyles } from '@/features/account/components/onboarding/onboardingStyles';
import { ONBOARDING_STEP_COUNT, useOnboarding } from '@/features/account/hooks/useOnboarding';
import { color, font } from '@/theme/theme';

/** gradely-app's setup, for a reviewer: Who · Credits alert · First topic. */
export default function OnboardingScreen() {
  const onboarding = useOnboarding();
  const insets = useSafeAreaInsets();
  const isLastStep = onboarding.step === ONBOARDING_STEP_COUNT;

  // One ScrollView holds every step, so each step starts at its own top.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [onboarding.step]);

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Paper />
      <View style={styles.frame}>
        {onboarding.step === 1 ? (
          <BackBar label="Cancel setup" chevron={false} onPress={onboarding.goBack} />
        ) : (
          <BackBar label="Back" onPress={onboarding.goBack} />
        )}
        <OnboardingProgress step={onboarding.step} stepCount={ONBOARDING_STEP_COUNT} />

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={onboardingStyles.step}>
            STEP {onboarding.step} OF {ONBOARDING_STEP_COUNT}
          </Text>
          {onboarding.step === 1 && <OnboardingWhoStep onboarding={onboarding} />}
          {onboarding.step === 2 && <OnboardingAlertStep onboarding={onboarding} />}
          {onboarding.step === 3 && <OnboardingTopicStep onboarding={onboarding} />}
          <View style={styles.error}>
            <FormMessage text={onboarding.errorMessage} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={isLastStep ? 'Finish setup' : 'Next'}
            onPress={onboarding.goNext}
            isBusy={onboarding.isFinishing}
            isDisabled={!onboarding.canContinue}
            trailing={<Icon name={isLastStep ? 'check' : 'arrowForward'} size={18} color={color.onPrimary} />}
            style={styles.next}
          />
          {isLastStep && (
            <Pressable accessibilityRole="button" onPress={onboarding.skipTopic} disabled={onboarding.isFinishing} style={styles.skip}>
              <Text style={styles.skipLabel}>Skip — I'll add topics later</Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: 520 },
  content: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24 },
  error: { marginTop: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24, gap: 6 },
  next: { minHeight: 54 },
  skip: { minHeight: 44, justifyContent: 'center' },
  skipLabel: { textAlign: 'center', fontFamily: font.ui, fontSize: 13, color: color.inkMuted },
});
