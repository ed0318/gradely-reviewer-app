import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { BalanceHeader } from '@/features/credits/components/BalanceHeader';
import { HistoryControls } from '@/features/credits/components/HistoryControls';
import { HistoryRowItem } from '@/features/credits/components/HistoryRowItem';
import { useCreditHistory } from '@/features/credits/hooks/useCreditHistory';
import type { HistoryRow } from '@/features/credits/historyRows';
import { AttemptsPager } from '@/features/progress/components/AttemptsPager';
import { useCredits } from '@/state/CreditsProvider';
import { color, font, space } from '@/theme/theme';

const keyOfRow = (row: HistoryRow) => String(row.id);
const renderRow = ({ item }: { item: HistoryRow }) => <HistoryRowItem row={item} />;

/**
 * Credit history (mockup 10): the balance, then what the server has recorded,
 * ten rows to a page, newest or oldest first, filtered by exam name. Reads the
 * server, so offline it says so and offers to try again.
 */
export default function CreditHistoryScreen() {
  const { balanceUnits } = useCredits();
  const history = useCreditHistory();
  // `navigate` returns to the Credits tab if it is already open underneath, instead of stacking another.
  const getCredits = useCallback(() => router.navigate('/credits'), []);
  const hasProblem = history.status === 'offline' || history.status === 'error';

  return (
    <Screen>
      <BackBar label="Back" />
      <BalanceHeader balanceUnits={balanceUnits} onGetCredits={getCredits} />
      <HistoryControls
        sort={history.sort}
        searchText={history.searchText}
        countText={history.countText}
        onChangeSort={history.setSort}
        onChangeSearch={history.setSearchText}
      />
      <View style={styles.body}>
        {history.status === 'loading' && <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading history" />}
        {hasProblem && (
          <View style={styles.problem}>
            <EmptyState
              icon={history.status === 'offline' ? 'wifi' : 'error'}
              title={history.status === 'offline' ? "You're offline" : "Couldn't load your history"}
              subtitle={history.status === 'offline' ? 'Your credit history lives on our server. Connect to the internet and try again.' : 'Something went wrong on our side. Try again in a moment.'}
            />
            <Button label="Try again" variant="outline" onPress={history.retry} />
          </View>
        )}
        {history.isEmpty && (
          <Text style={styles.empty}>{history.isFiltered ? `No exam matches “${history.searchTerm}”.` : 'No credit history yet. Your purchases and exams show up here.'}</Text>
        )}
        {history.status === 'ready' && !history.isEmpty && (
          <FlashList
            data={history.rows}
            keyExtractor={keyOfRow}
            renderItem={renderRow}
            contentContainerStyle={styles.list}
            style={history.isFetching ? styles.fetching : undefined}
            refreshing={history.isRefreshing}
            onRefresh={history.refresh}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {history.status === 'ready' && !history.isEmpty && <AttemptsPager paging={history.paging} onPrevious={history.goToPrevious} onNext={history.goToNext} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  list: { paddingHorizontal: space.gutter, paddingTop: 4 },
  fetching: { opacity: 0.55 },
  loading: { marginTop: 40 },
  problem: { flex: 1, paddingHorizontal: space.gutter, gap: 12, justifyContent: 'center' },
  empty: { paddingVertical: 32, paddingHorizontal: space.gutter, textAlign: 'center', fontFamily: font.uiRegular, fontSize: 14, color: color.inkMuted },
});
