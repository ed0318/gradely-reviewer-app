import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { IOS, IOS_DIM } from '@/theme/press';
import { color, font } from '@/theme/theme';

type ScreenHeaderProps = { title: string; onBack?: () => void };

/** A back button above a large slab title ("Settings."). */
export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.root}>
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={4}
          style={({ pressed }) => [styles.back, IOS && pressed && IOS_DIM]}
        >
          <Icon name="back" />
        </Pressable>
      )}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 2, paddingBottom: 8 },
  back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.title, fontSize: 30, color: color.ink },
});
