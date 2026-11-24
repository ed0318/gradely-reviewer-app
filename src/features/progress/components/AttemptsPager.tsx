import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { color, font, radius } from '@/theme/theme';
import type { PagingSummary } from '../paging';

function PagerButton({ label, direction, isDisabled, onPress }: { label: string; direction: 'previous' | 'next'; isDisabled: boolean; onPress: () => void }) {
  const tone = isDisabled ? color.chevron : color.primary;
  const icon = <Icon name={direction === 'previous' ? 'chevronLeft' : 'chevronRight'} size={18} color={tone} />;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, !isDisabled && styles.buttonOn]}
      accessibilityRole="button"
      accessibilityLabel={`${label} page`}
      accessibilityState={{ disabled: isDisabled }}
    >
      {direction === 'previous' && icon}
      <Text style={[styles.buttonLabel, { color: tone }]}>{label}</Text>
      {direction === 'next' && icon}
    </Pressable>
  );
}

/** "Prev   Page 1 of 3 · 1–10 of 23   Next". */
export function AttemptsPager({ paging, onPrevious, onNext }: { paging: PagingSummary; onPrevious: () => void; onNext: () => void }) {
  return (
    <View style={styles.root}>
      <PagerButton label="Prev" direction="previous" isDisabled={!paging.hasPrevious} onPress={onPrevious} />
      <Text style={styles.status} accessibilityRole="summary" accessibilityLiveRegion="polite">
        Page <Text style={styles.pageNumber}>{paging.pageIndex + 1}</Text> of {paging.pageCount} · {paging.rangeText}
      </Text>
      <PagerButton label="Next" direction="next" isDisabled={!paging.hasNext} onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 4, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.paper },
  button: { minHeight: 44, minWidth: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8, borderRadius: radius.field, borderWidth: 1, borderColor: 'transparent' },
  buttonOn: { borderColor: color.line, backgroundColor: color.surface },
  buttonLabel: { fontFamily: font.eyebrow, fontSize: 13 },
  status: { flexShrink: 1, textAlign: 'center', fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  pageNumber: { fontFamily: font.monoStrong, color: color.ink },
});
