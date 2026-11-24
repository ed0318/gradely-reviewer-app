import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Icon } from '@/components/Icon';
import type { TopicQuestion } from '@/db/records';
import { color, font, space } from '@/theme/theme';
import { describeAnswer, describePoints } from '../questionRules';

type Props = {
  question: TopicQuestion;
  number: number;
  onOpen: (questionId: string) => void;
  onDelete: (question: TopicQuestion, number: number) => void;
  /** Told with this row's `close` as it opens, so the screen can close the row that was open. */
  onOpening: (closeThisRow: () => void) => void;
};

const DELETE_ACTION = [{ name: 'delete', label: 'Delete question' }];

/**
 * One question in the topic list. Swipe left to show Delete; the same action is
 * offered to a screen reader, which cannot swipe. Memoized with stable
 * callbacks, so scrolling hundreds of these only draws the rows that move.
 */
export const QuestionRow = memo(function QuestionRow({ question, number, onOpen, onDelete, onOpening }: Props) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const closeRow = useCallback(() => swipeRef.current?.close(), []);

  // The list recycles rows: one that was left open must not show another question open.
  useEffect(() => {
    swipeRef.current?.close();
  }, [question.id]);

  const handleOpen = useCallback(() => onOpen(question.id), [onOpen, question.id]);
  const handleDelete = useCallback(() => {
    swipeRef.current?.close();
    onDelete(question, number);
  }, [onDelete, question, number]);
  const handleOpening = useCallback(() => onOpening(closeRow), [onOpening, closeRow]);
  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (event.nativeEvent.actionName === 'delete') handleDelete();
    },
    [handleDelete],
  );

  const renderDeleteAction = useCallback(
    () => (
      <Pressable onPress={handleDelete} style={styles.deleteAction} accessibilityRole="button" accessibilityLabel={`Delete question ${number}`}>
        <Icon name="delete" size={20} color={color.onPrimary} />
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    ),
    [handleDelete, number],
  );

  const answer = describeAnswer(question);
  const points = describePoints(question.point);
  return (
    <ReanimatedSwipeable ref={swipeRef} renderRightActions={renderDeleteAction} overshootRight={false} rightThreshold={40} onSwipeableWillOpen={handleOpening}>
      <Pressable
        onPress={handleOpen}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Question ${number}: ${question.question.trim() || 'no wording yet'}. ${points}. ${answer}.`}
        accessibilityActions={DELETE_ACTION}
        onAccessibilityAction={handleAccessibilityAction}
      >
        <Text style={styles.number}>{number}</Text>
        <View style={styles.body}>
          <Text style={styles.text} numberOfLines={3}>
            {question.question.trim() || 'No wording yet'}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.points}>{points}</Text>
            <View style={styles.chip}>
              <Text style={styles.chipLabel} numberOfLines={1}>
                {answer}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: space.gutter,
    paddingVertical: 14,
    minHeight: 64,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.rule,
  },
  number: { width: 28, fontFamily: font.monoStrong, fontSize: 13, color: color.inkMuted, paddingTop: 2 },
  body: { flex: 1, minWidth: 0, gap: 6 },
  text: { fontFamily: font.uiRegular, fontSize: 15, lineHeight: 21, color: color.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  points: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  chip: { flexShrink: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: color.primaryTint },
  chipLabel: { fontFamily: font.eyebrow, fontSize: 12, color: color.primary },
  deleteAction: { width: 88, backgroundColor: color.rust, alignItems: 'center', justifyContent: 'center', gap: 4 },
  deleteLabel: { fontFamily: font.eyebrow, fontSize: 13, color: color.onPrimary },
});
