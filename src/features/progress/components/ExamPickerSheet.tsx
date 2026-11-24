import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { ProgressExam } from '@/db/repositories/progress';
import { useSystemInsets } from '@/layout/useLayout';
import { color, radius } from '@/theme/theme';
import { ExamPickerPanel } from './ExamPickerPanel';

type Props = { visible: boolean; exams: ProgressExam[]; currentExamId: string | null; onChoose: (examId: string) => void; onClose: () => void };

/**
 * The exam picker, drawn as a tall sheet over a dimmed screen (mockup 8b). It is
 * a Modal rather than the gorhom `Sheet` because it holds a search box and a long
 * list, and that sheet sizes itself to its content; Android's back closes it.
 */
export function ExamPickerSheet({ visible, exams, currentExamId, onChoose, onClose }: Props) {
  const { top } = useSystemInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close exam picker" />
        <View style={[styles.sheet, { marginTop: top + 64 }]} accessibilityViewIsModal>
          <ExamPickerPanel exams={exams} currentExamId={currentExamId} onChoose={onChoose} onClose={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23, 34, 51, 0.45)' },
  sheet: { flex: 1, backgroundColor: color.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
});
