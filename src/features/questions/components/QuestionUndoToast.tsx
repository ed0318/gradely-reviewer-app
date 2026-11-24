import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { color, font, radius, space } from '@/theme/theme';

/** "Question 2 deleted · Undo", at the bottom of the topic screen for five seconds. */
export function QuestionUndoToast({ number, onUndo }: { number: number; onUndo: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOutDown.duration(160)} style={styles.root}>
      <View style={styles.card} accessibilityLiveRegion="polite" accessible accessibilityLabel={`Question ${number} deleted`}>
        <Text style={styles.message}>Question {number} deleted</Text>
      </View>
      <Pressable onPress={onUndo} style={styles.undo} accessibilityRole="button" accessibilityLabel={`Undo, bring back question ${number}`}>
        <Text style={styles.undoLabel}>Undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    bottom: 24,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: radius.card,
    backgroundColor: color.ink,
    elevation: 8,
    shadowColor: color.ink,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  card: { flex: 1, justifyContent: 'center', minHeight: 52 },
  message: { fontFamily: font.uiRegular, fontSize: 14, color: color.onPrimary },
  undo: { minHeight: 48, minWidth: 64, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  undoLabel: { fontFamily: font.uiBold, fontSize: 14, color: color.highlight },
});
