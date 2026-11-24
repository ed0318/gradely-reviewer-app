import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import { color, font, space } from '@/theme/theme';
import { calculatePercent, formatDuration, formatPoints } from '../formatExam';

type Props = {
  attemptNumber: number;
  examName: string;
  score: number;
  totalPoints: number;
  elapsedSeconds: number;
  changeText: string | null;
  remark: string | null;
  onDelete: () => void;
};

/** The navy band: Done, the attempt, the score big, the percent, the change from last time and a remark in the margin's handwriting. */
export function ResultsHeader({ attemptNumber, examName, score, totalPoints, elapsedSeconds, changeText, remark, onDelete }: Props) {
  const done = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const percent = calculatePercent(score, totalPoints);
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable onPress={done} style={styles.done} accessibilityRole="button" accessibilityLabel="Done">
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
        <Text style={styles.attempt}>ATTEMPT {attemptNumber}</Text>
        <Pressable onPress={onDelete} style={styles.trash} accessibilityRole="button" accessibilityLabel="Delete this exam">
          <Icon name="delete" size={20} color={color.onNavyMuted} />
        </Pressable>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {examName}
      </Text>
      <View style={styles.scoreRow} accessible accessibilityLabel={`Score ${formatPoints(score)} out of ${formatPoints(totalPoints)}, ${percent} percent`}>
        <Text style={styles.score}>
          {formatPoints(score)}
          <Text style={styles.total}>/{formatPoints(totalPoints)}</Text>
        </Text>
        <View style={styles.side}>
          <Text style={styles.percent}>{percent}%</Text>
          {changeText && (
            <View style={styles.change}>
              <Text style={styles.changeText}>{changeText}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.time}>Time taken {formatDuration(elapsedSeconds)}</Text>
      {remark && <Text style={styles.remark}>{remark}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8, paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 18, backgroundColor: color.primary },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  done: { height: 44, justifyContent: 'center', minWidth: 56 },
  doneLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.onPrimary },
  attempt: { fontFamily: font.eyebrow, fontSize: 12, letterSpacing: 1, color: color.onNavyMuted },
  trash: { width: 56, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  name: { fontFamily: font.uiRegular, fontSize: 14, color: color.onNavyMuted },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  score: { fontFamily: font.title, fontSize: 68, lineHeight: 72, color: color.onPrimary },
  total: { fontSize: 32, color: color.onNavyMuted },
  side: { gap: 4, paddingBottom: 6, flexShrink: 1 },
  percent: { fontFamily: font.monoStrong, fontSize: 18, color: color.onPrimary },
  change: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: color.highlight },
  changeText: { fontFamily: font.uiBold, fontSize: 12, color: color.ink },
  time: { fontFamily: font.uiRegular, fontSize: 12, color: color.onNavyMuted },
  remark: { fontFamily: font.hand, fontSize: 17, color: color.highlight },
});
