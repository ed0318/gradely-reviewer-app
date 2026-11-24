import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { color, font } from '@/theme/theme';
import type { ContinueReviewingState } from '../hooks/useContinueReviewing';
import { ReviewedExamRow } from './ReviewedExamRow';

/**
 * "Continue reviewing." The few most recent exams. Only a handful are ever given
 * to it, so plain rows are enough (Progress holds the long list). Nothing is
 * drawn until there is an exam taken, so a new phone's Home stays short.
 */
export function ContinueReviewingList({ reviewing }: { reviewing: ContinueReviewingState }) {
  if (reviewing.exams.length === 0) return null;
  // The first is the one taken most recently, which is also where Progress opens by itself.
  const openProgress = () => router.navigate({ pathname: '/progress', params: { examId: reviewing.exams[0].examId } });
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.heading} accessibilityRole="header">
          Continue reviewing.
        </Text>
        <Pressable onPress={openProgress} hitSlop={8} style={styles.link} accessibilityRole="link" accessibilityLabel="Open Progress">
          <Text style={styles.linkLabel}>Progress</Text>
        </Pressable>
      </View>
      <Card>
        {reviewing.exams.map((exam) => (
          <ReviewedExamRow key={exam.examId} exam={exam} />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontFamily: font.title, fontSize: 22, color: color.ink },
  link: { minHeight: 44, justifyContent: 'center' },
  linkLabel: { fontFamily: font.eyebrow, fontSize: 13, color: color.primary },
});
