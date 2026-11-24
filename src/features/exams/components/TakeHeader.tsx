import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { color, font, space } from '@/theme/theme';
import { ExamTimerChip, type ExamClock } from './ExamTimerChip';

type Props = {
  position: number;
  total: number;
  isFlagged: boolean;
  line: string;
  clock: React.MutableRefObject<ExamClock>;
  isClockRunning: boolean;
  onQuit: () => void;
  onToggleFlag: () => void;
  onPause: () => void;
};

/** Quit, "7 / 30", Flag, the progress bar, and the exam's line with the time taken. */
export function TakeHeader({ position, total, isFlagged, line, clock, isClockRunning, onQuit, onToggleFlag, onPause }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable onPress={onQuit} style={styles.quit} hitSlop={6} accessibilityRole="button" accessibilityLabel="Quit the exam">
          <Icon name="close" size={18} color={color.inkMuted} />
          <Text style={styles.quitLabel}>Quit</Text>
        </Pressable>
        <Text style={styles.count} accessibilityLabel={`Question ${position} of ${total}`}>
          {position} <Text style={styles.total}>/ {total}</Text>
        </Text>
        <Pressable
          onPress={onToggleFlag}
          style={styles.flag}
          accessibilityRole="button"
          accessibilityLabel={isFlagged ? 'Remove the flag from this question' : 'Flag this question'}
          accessibilityState={{ selected: isFlagged }}
        >
          <Icon name="flag" size={22} color={isFlagged ? color.rust : color.inkMuted} />
        </Pressable>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: position }} accessibilityLabel={`Question ${position} of ${total}`} style={styles.bar}>
        <ProgressBar progress={position / total} />
      </View>
      <View style={styles.line}>
        <Text style={styles.lineText} numberOfLines={1}>
          {line}
        </Text>
        <ExamTimerChip clock={clock} isRunning={isClockRunning} onPause={onPause} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 12, backgroundColor: color.surface, borderBottomWidth: 1, borderBottomColor: color.line },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quit: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 60 },
  quitLabel: { fontFamily: font.eyebrow, fontSize: 14, color: color.inkMuted },
  count: { fontFamily: font.monoStrong, fontSize: 14, color: color.ink },
  total: { color: color.inkMuted },
  flag: { width: 44, height: 44, marginRight: -10, alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  lineText: { flex: 1, fontFamily: font.eyebrow, fontSize: 12, letterSpacing: 0.6, color: color.inkMuted, textTransform: 'uppercase' },
});
