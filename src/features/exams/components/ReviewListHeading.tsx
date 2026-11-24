import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/theme/theme';

type Props = { reviewCount: number; totalCount: number; showAll: boolean; onToggle: () => void };

/** "4 to review." with "See all 30" beside it, which flips to "Only the ones to review". */
export function ReviewListHeading({ reviewCount, totalCount, showAll, onToggle }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title} accessibilityRole="header">
        {showAll ? `All ${totalCount}.` : reviewCount === 0 ? 'Nothing to review.' : `${reviewCount} to review.`}
      </Text>
      {totalCount > 0 && (
        <Pressable onPress={onToggle} hitSlop={8} style={styles.toggle} accessibilityRole="button">
          <Text style={styles.toggleLabel}>{showAll ? 'Only to review' : `See all ${totalCount}`}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, marginBottom: 6 },
  title: { fontFamily: font.title, fontSize: 22, color: color.ink },
  toggle: { minHeight: 44, justifyContent: 'center' },
  toggleLabel: { fontFamily: font.eyebrow, fontSize: 13, color: color.primary },
});
