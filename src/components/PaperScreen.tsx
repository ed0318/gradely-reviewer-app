import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paper } from '@/components/Paper';
import { color, space } from '@/theme/theme';

type PaperScreenProps = {
  children: React.ReactNode;
  /** Pinned under the scrolling content: the screen's main buttons. */
  footer?: React.ReactNode;
  /** Ruled paper with the red margin (sign-in, hand-over, Home) or plain white (Settings). */
  isRuled?: boolean;
};

/** A screen on the Gradely page: safe area, keyboard-aware scroll, and a pinned footer. */
export function PaperScreen({ children, footer, isRuled = true }: PaperScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {isRuled && <Paper margin={14} />}
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, isRuled && styles.ruledContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer && <View style={[styles.footer, isRuled && styles.ruledFooter]}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  fill: { flex: 1 },
  content: { paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: 24, gap: space.gap },
  ruledContent: { paddingLeft: 34, paddingRight: 24 },
  footer: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 12, gap: 6 },
  ruledFooter: { paddingLeft: 34, paddingRight: 24 },
});
