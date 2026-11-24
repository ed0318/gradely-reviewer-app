import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { describeQuestionCount } from '@/features/topics/describeQuestionCount';
import { color, font, radius } from '@/theme/theme';
import type { ExamTopic } from '../hooks/useExamTopic';

/** "Questions from: Civil Service — Numerical · 84 Qs · Change". */
export function TopicPickerRow({ topic, onChange }: { topic: ExamTopic; onChange: () => void }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>Questions from</Text>
      <View style={styles.box}>
        <Icon name="topics" size={18} color={color.primary} />
        <Text style={styles.title} numberOfLines={2}>
          {topic.title}
        </Text>
        <Text style={styles.count}>{describeQuestionCount(topic.questionCount)}</Text>
        <Pressable onPress={onChange} hitSlop={8} style={styles.change} accessibilityRole="button" accessibilityLabel={`Change topic. Now ${topic.title}`}>
          <Text style={styles.changeLabel}>Change</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontFamily: font.eyebrow, fontSize: 13, color: color.ink },
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingLeft: 14, paddingRight: 4, borderRadius: radius.field, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  title: { flex: 1, minWidth: 0, fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
  count: { fontFamily: font.mono, fontSize: 12, color: color.inkMuted },
  change: { minHeight: 44, minWidth: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  changeLabel: { fontFamily: font.eyebrow, fontSize: 13, color: color.primary },
});
