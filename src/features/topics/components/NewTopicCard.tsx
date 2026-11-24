import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

/** Home's "New topic · always free" card, beside "New exam". */
export function NewTopicCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel="New topic, always free">
      <Icon name="add" size={24} color={color.primary} />
      <View style={styles.words}>
        <Text style={styles.title}>New topic</Text>
        <Text style={styles.sub}>always free</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 110, justifyContent: 'space-between', gap: 22, padding: 16, borderRadius: radius.card, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  words: { gap: 2 },
  title: { fontFamily: font.title, fontSize: 20, color: color.ink },
  sub: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
