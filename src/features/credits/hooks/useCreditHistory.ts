import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listCreditTransactions, type CreditTransaction } from '@/api/credits';
import type { Pagination } from '@/api/client';
import { isOfflineError, isRequestCancelled } from '@/api/errors';
import { useDebouncedValue } from '@/state/useDebouncedValue';
import { buildHistoryRow, describeHistoryCount, describeServerPaging, type HistoryRow } from '../historyRows';

export type HistorySort = 'newest' | 'oldest';
export type HistoryStatus = 'loading' | 'ready' | 'offline' | 'error';

const SEARCH_DELAY_MS = 350;

/**
 * Credit history, one server page at a time: the page, the sort and the
 * exam-name filter all go to the server (`GET /credits/transactions`), and a
 * request still running when any of them changes (or the screen closes) is
 * aborted and its answer ignored. Reloads when the screen is focused again, so
 * a purchase made in between shows.
 */
export function useCreditHistory() {
  const [pageNumber, setPageNumber] = useState(1);
  const [sort, setSort] = useState<HistorySort>('newest');
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), SEARCH_DELAY_MS);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<HistoryStatus>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedKey, setLoadedKey] = useState('');
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadedAt, setLoadedAt] = useState(() => new Date());

  // A new filter or order starts again at the first page.
  const lastQueryRef = useRef({ sort, search });
  useEffect(() => {
    if (lastQueryRef.current.sort === sort && lastQueryRef.current.search === search) return;
    lastQueryRef.current = { sort, search };
    setPageNumber(1);
  }, [sort, search]);

  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) setReloadKey((key) => key + 1);
      hasFocusedRef.current = true;
    }, []),
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = `${pageNumber}|${sort}|${search}|${reloadKey}`;
    listCreditTransactions({ page: pageNumber, search, sort, signal: controller.signal })
      .then((answer) => {
        setTransactions(answer.transactions);
        setPagination(answer.pagination);
        setLoadedAt(new Date());
        setLoadedKey(requestKey);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isRequestCancelled(error)) return;
        setStatus(isOfflineError(error) ? 'offline' : 'error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRefreshing(false);
      });
    return () => controller.abort();
  }, [pageNumber, sort, search, reloadKey]);

  const rows = useMemo<HistoryRow[]>(() => transactions.map((transaction) => buildHistoryRow(transaction, loadedAt)), [transactions, loadedAt]);
  const paging = useMemo(() => describeServerPaging(pagination), [pagination]);
  const isFiltered = search.length > 0;

  const retry = useCallback(() => {
    setStatus('loading');
    setReloadKey((key) => key + 1);
  }, []);
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  return {
    status,
    rows,
    paging,
    isRefreshing,
    /** A page, order or filter was asked for and has not arrived yet: the rows shown are the previous ones. */
    isFetching: loadedKey !== `${pageNumber}|${sort}|${search}|${reloadKey}`,
    sort,
    searchText,
    isFiltered,
    searchTerm: search,
    countText: describeHistoryCount(pagination?.total ?? 0, isFiltered),
    isEmpty: status === 'ready' && rows.length === 0,
    setSort,
    setSearchText,
    goToPrevious: useCallback(() => setPageNumber((page) => Math.max(1, page - 1)), []),
    goToNext: useCallback(() => setPageNumber((page) => page + 1), []),
    retry,
    refresh,
  };
}
