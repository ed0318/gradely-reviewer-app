import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, space } from '@/theme/theme';

/** The highlighter-yellow "Add question" button floating over the list. */
export function AddQuestionButton({ onPress, isBusy }: { onPress: () => void; isBusy: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isBusy}
      style={({ pressed }) => [styles.root, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel="Add question"
      accessibilityState={{ disabled: isBusy, busy: isBusy }}
    >
      <Icon name="add" size={22} color={color.ink} />
      <Text style={styles.label}>Add question</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: space.gutter,
    bottom: 24,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: color.highlight,
    borderWidth: 1,
    borderColor: '#E9D676',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: color.ink,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  label: { fontFamily: font.uiBold, fontSize: 15, color: color.ink },
});
