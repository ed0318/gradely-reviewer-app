import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';

/** Home's navy "New exam · 0.25 credit per item" card, beside "New topic". */
export function NewExamCard() {
  return (
    <Pressable onPress={() => router.push('/exam/new')} style={styles.card} accessibilityRole="button" accessibilityLabel="New exam, 0.25 credit per item">
      <Icon name="exam" size={24} color={color.onPrimary} />
      <View style={styles.words}>
        <Text style={styles.title}>New exam</Text>
        <Text style={styles.sub}>0.25 credit per item</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 110, justifyContent: 'space-between', gap: 22, padding: 16, borderRadius: radius.card, backgroundColor: color.primary },
  words: { gap: 2 },
  title: { fontFamily: font.title, fontSize: 20, color: color.onPrimary },
  sub: { fontFamily: font.uiRegular, fontSize: 12, color: color.onNavyMuted },
});
