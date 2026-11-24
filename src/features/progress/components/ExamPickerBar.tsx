import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import type { ProgressExam } from '@/db/repositories/progress';
import { color, font, radius } from '@/theme/theme';

type Props = { exam: ProgressExam; onOpenPicker: () => void; onDelete: () => void };

/** The exam on show, opening the picker, with the trash button beside it. */
export function ExamPickerBar({ exam, onOpenPicker, onDelete }: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        onPress={onOpenPicker}
        style={styles.picker}
        accessibilityRole="button"
        accessibilityLabel={`Exam: ${exam.name}${exam.topicTitle ? `, ${exam.topicTitle}` : ''}. Choose another exam`}
      >
        <View style={styles.words}>
          <Text style={styles.label}>EXAM</Text>
          <Text style={styles.name} numberOfLines={1}>
            {exam.name}
          </Text>
          {exam.topicTitle !== null && (
            <Text style={styles.topic} numberOfLines={1}>
              {exam.topicTitle}
            </Text>
          )}
        </View>
        <Icon name="expandMore" size={22} color={color.primary} />
      </Pressable>
      <Pressable onPress={onDelete} style={styles.trash} accessibilityRole="button" accessibilityLabel="Delete this exam">
        <Icon name="delete" size={22} color={color.rust} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', gap: 8 },
  picker: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 7, paddingHorizontal: 14, borderRadius: radius.card, borderWidth: 1, borderColor: color.fieldBorder, backgroundColor: color.surface },
  words: { flex: 1, minWidth: 0, gap: 1 },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.inkMuted },
  name: { fontFamily: font.rowTitle, fontSize: 16, color: color.ink },
  topic: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  trash: { width: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
});
