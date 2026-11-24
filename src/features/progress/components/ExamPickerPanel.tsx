import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Icon } from '@/components/Icon';
import { SearchField } from '@/components/SearchField';
import type { ProgressExam } from '@/db/repositories/progress';
import { color, font, space } from '@/theme/theme';
import { describeExamCount, filterProgressExams } from '../filterProgressExams';
import { ExamPickerRow } from './ExamPickerRow';

type Props = { exams: ProgressExam[]; currentExamId: string | null; onChoose: (examId: string) => void; onClose: () => void };

const keyOfExam = (exam: ProgressExam) => exam.examId;

/** The sheet's content: title, search, "2 of 6 exams" and the exams. Its search starts empty each time the sheet opens. */
export function ExamPickerPanel({ exams, currentExamId, onChoose, onClose }: Props) {
  const [search, setSearch] = useState('');
  const matches = useMemo(() => filterProgressExams(exams, search), [exams, search]);
  const renderExam = useCallback(
    ({ item }: { item: ProgressExam }) => <ExamPickerRow exam={item} isCurrent={item.examId === currentExamId} onChoose={onChoose} />,
    [currentExamId, onChoose],
  );

  return (
    <View style={styles.root}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Choose an exam.
        </Text>
        <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Icon name="close" size={22} color={color.inkMuted} />
        </Pressable>
      </View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search exams or topics" style={styles.search} />
      <Text style={styles.count} accessibilityLiveRegion="polite">
        {describeExamCount(matches.length, exams.length, search)}
      </Text>
      {matches.length === 0 ? (
        <Text style={styles.none}>No exam matches “{search.trim()}”.</Text>
      ) : (
        <FlashList
          data={matches}
          renderItem={renderExam}
          keyExtractor={keyOfExam}
          extraData={currentExamId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: color.line, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: space.gutter, paddingRight: space.gutter - 10, marginBottom: 12 },
  title: { fontFamily: font.title, fontSize: 24, color: color.ink },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  // SearchField carries the gutter and a bottom margin of its own.
  search: { height: 48, marginBottom: 8 },
  count: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted, paddingHorizontal: space.gutter, marginBottom: 4 },
  none: { fontFamily: font.uiRegular, fontSize: 14, color: color.inkMuted, textAlign: 'center', paddingVertical: 24, paddingHorizontal: space.gutter },
  list: { paddingHorizontal: space.gutter, paddingBottom: 24 },
});
