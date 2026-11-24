import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Segmented } from '@/components/Segmented';
import { color, font, radius, space } from '@/theme/theme';
import type { HistorySort } from '../hooks/useCreditHistory';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
];

type Props = {
  sort: HistorySort;
  searchText: string;
  countText: string;
  onChangeSort: (sort: HistorySort) => void;
  onChangeSearch: (text: string) => void;
};

/** "History." with Newest / Oldest, and the filter by exam name with how many entries match. */
export function HistoryControls({ sort, searchText, countText, onChangeSort, onChangeSearch }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          History.
        </Text>
        <View style={styles.sort}>
          <Segmented options={SORT_OPTIONS} value={sort} onChange={(key) => onChangeSort(key as HistorySort)} />
        </View>
      </View>
      <View style={styles.field}>
        <Icon name="search" size={17} color={color.inkMuted} />
        <TextInput
          value={searchText}
          onChangeText={onChangeSearch}
          placeholder="Filter by exam name"
          placeholderTextColor={color.inkMuted}
          accessibilityLabel="Filter by exam name"
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.count} accessibilityLiveRegion="polite">
          {countText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8, paddingHorizontal: space.gutter, paddingTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: font.title, fontSize: 22, color: color.ink },
  sort: { width: 168 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12, borderRadius: radius.field, borderWidth: 1, borderColor: color.fieldBorder, backgroundColor: color.surface },
  input: { flex: 1, minWidth: 0, fontFamily: font.uiRegular, fontSize: 14, color: color.ink, padding: 0 },
  count: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
