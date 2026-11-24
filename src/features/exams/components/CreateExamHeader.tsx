import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import { color, font, space } from '@/theme/theme';

/** "✕  New exam." The close control goes back to where the student came from. */
export function CreateExamHeader() {
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  return (
    <View style={styles.root}>
      <Pressable onPress={close} hitSlop={6} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
        <Icon name="close" size={24} color={color.ink} />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header">
        New exam.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.gutter, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: color.line, backgroundColor: color.surface },
  close: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.title, fontSize: 28, color: color.ink },
});
