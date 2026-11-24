import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import type { AttemptsPage } from '../actions';
import type { PagingSummary } from '../paging';
import { AttemptRow, ATTEMPT_COLUMNS } from './AttemptRow';
import { AttemptsPager } from './AttemptsPager';

type Props = { page: AttemptsPage | null; paging: PagingSummary; onPrevious: () => void; onNext: () => void };

/** Every attempt, newest first, ten to a page. At most ten plain rows, so no list is needed. */
export function AttemptsTable({ page, paging, onPrevious, onNext }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={[styles.heading, { width: ATTEMPT_COLUMNS.number }]}>#</Text>
        <Text style={[styles.heading, styles.headingDate]}>DATE</Text>
        <Text style={[styles.heading, { width: ATTEMPT_COLUMNS.score }]}>SCORE</Text>
        <Text style={[styles.heading, { width: ATTEMPT_COLUMNS.time }]}>TIME</Text>
      </View>
      {page === null ? (
        <ActivityIndicator style={styles.loading} color={color.primary} />
      ) : (
        page.attempts.map((attempt) => <AttemptRow key={attempt.attemptNumber} attempt={attempt} now={page.loadedAt} />)
      )}
      <AttemptsPager paging={paging} onPrevious={onPrevious} onNext={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden', backgroundColor: color.surface },
  head: { flexDirection: 'row', gap: 8, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: color.paper },
  heading: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.7, color: color.inkMuted },
  headingDate: { flex: 1, minWidth: 0 },
  loading: { height: 120 },
});
