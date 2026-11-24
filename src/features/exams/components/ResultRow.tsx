import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';
import type { ResultItem } from '../resultItems';

type Props = { item: ResultItem; onMark: (questionId: string, isCorrect: boolean) => void };

/**
 * One question in the review: what was asked, what was given and what was right.
 * An essay waiting for a mark shows the student's writing beside the answer guide
 * and two buttons, so the score can count it.
 */
export const ResultRow = memo(function ResultRow({ item, onMark }: Props) {
  const markRight = useCallback(() => onMark(item.id, true), [onMark, item.id]);
  const markWrong = useCallback(() => onMark(item.id, false), [onMark, item.id]);
  const isPending = item.verdict === 'pending';
  const isCorrect = item.verdict === 'correct';

  return (
    <View style={styles.card}>
      <Text style={styles.question}>
        {item.number}. {item.question}
      </Text>
      {isPending ? (
        <>
          <Text style={styles.label}>YOUR ANSWER</Text>
          <Text style={styles.essay}>{item.givenText}</Text>
          <Text style={styles.label}>ANSWER GUIDE</Text>
          <Text style={styles.essay}>{item.correctText}</Text>
          <View style={styles.markRow}>
            <Pressable onPress={markRight} style={[styles.mark, styles.markRight]} accessibilityRole="button" accessibilityLabel="Mark this essay right">
              <Text style={styles.markRightLabel}>I got it right</Text>
            </Pressable>
            <Pressable onPress={markWrong} style={[styles.mark, styles.markWrong]} accessibilityRole="button" accessibilityLabel="Mark this essay wrong">
              <Text style={styles.markWrongLabel}>Not quite</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={styles.line}>
            <Icon name={isCorrect ? 'check' : 'close'} size={16} color={isCorrect ? color.ok : color.rust} />
            <Text style={[styles.given, !isCorrect && { color: color.dangerInk }]} accessibilityLabel={`${isCorrect ? 'You answered' : 'You answered wrong'}: ${item.givenText}`}>
              You: <Text style={[styles.mono, !isCorrect && !item.isBlank && styles.struck]}>{item.givenText}</Text>
            </Text>
          </View>
          {!isCorrect && (
            <View style={styles.line}>
              <Icon name="check" size={16} color={color.ok} />
              <Text style={styles.right}>
                Answer: <Text style={styles.mono}>{item.correctText}</Text>
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { gap: 8, padding: 14, marginBottom: 10, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  question: { fontFamily: font.rowTitle, fontSize: 14, lineHeight: 20, color: color.ink },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  given: { flex: 1, fontFamily: font.uiRegular, fontSize: 13, color: color.ink },
  right: { flex: 1, fontFamily: font.rowTitle, fontSize: 13, color: color.ok },
  mono: { fontFamily: font.mono },
  struck: { textDecorationLine: 'line-through' },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 1, color: color.inkMuted },
  essay: { fontFamily: font.uiRegular, fontSize: 13.5, lineHeight: 19, color: color.ink },
  markRow: { flexDirection: 'row', gap: 8 },
  mark: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field, borderWidth: 1 },
  markRight: { borderColor: color.ok, backgroundColor: color.surface },
  markWrong: { borderColor: color.rust, backgroundColor: color.surface },
  markRightLabel: { fontFamily: font.rowTitle, fontSize: 14, color: color.ok },
  markWrongLabel: { fontFamily: font.rowTitle, fontSize: 14, color: color.rust },
});
