import type { CreditTransaction } from '@/api/credits';
import { formatCredits } from '@/lib/creditUnits';
import type { Pagination } from '@/api/client';
import type { PagingSummary } from '@/features/progress/paging';

/** One row of Credit history, ready to draw: "Exam name · 30 items", when, and a signed amount. */
export type HistoryRow = {
  id: number;
  title: string;
  when: string;
  /** "+280" or "−7.5", with a real minus sign. */
  amount: string;
  /** Credits in (a purchase, a refund, an adjustment up) draw green. */
  isGain: boolean;
  /** For a screen reader: "Bought 280 credits, Nov 8, 4:45 PM, plus 280 credits". */
  spokenLabel: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function readParts(date: Date, timeZone: string | undefined) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: read('year'), month: read('month'), day: read('day'), hour: read('hour'), minute: read('minute') };
}

/**
 * "Today · 20:06", "Nov 21 · 08:30", and the year only for another year. The
 * server stores UTC; this shows the phone's own time zone (or `timeZone`, for tests).
 */
export function formatHistoryWhen(isoTime: string | null, now: Date, timeZone?: string): string {
  if (!isoTime) return '';
  const at = new Date(isoTime);
  if (Number.isNaN(at.getTime())) return '';
  const then = readParts(at, timeZone);
  const today = readParts(now, timeZone);
  const clock = `${String(then.hour).padStart(2, '0')}:${String(then.minute).padStart(2, '0')}`;
  const isToday = then.year === today.year && then.month === today.month && then.day === today.day;
  const day = isToday ? 'Today' : `${MONTHS[then.month - 1]} ${then.day}${then.year === today.year ? '' : `, ${then.year}`}`;
  return `${day} · ${clock}`;
}

function describeItems(itemCount: number | null): string {
  if (itemCount === null) return '';
  return `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
}

function buildTitle(transaction: CreditTransaction): string {
  const credits = formatCredits(Math.abs(transaction.units));
  switch (transaction.type) {
    case 'purchase':
      return `Bought ${credits} credits`;
    case 'refund':
      return `Refund · ${credits} credits`;
    case 'adjustment':
      return 'Credit adjustment';
    case 'exam_charge': {
      const items = describeItems(transaction.itemCount);
      const name = transaction.examName ?? 'Exam';
      return items ? `${name} · ${items}` : name;
    }
  }
}

export function buildHistoryRow(transaction: CreditTransaction, now: Date, timeZone?: string): HistoryRow {
  const isGain = transaction.units > 0;
  const credits = formatCredits(Math.abs(transaction.units));
  const when = formatHistoryWhen(transaction.createdAt, now, timeZone);
  const title = buildTitle(transaction);
  return {
    id: transaction.id,
    title,
    when,
    amount: `${isGain ? '+' : '−'}${credits}`,
    isGain,
    spokenLabel: `${title}, ${when}, ${isGain ? 'plus' : 'minus'} ${credits} credits`,
  };
}

/** The pager's numbers from the server's own paging (it decides the page, so "Page X of Y" is never guessed). */
export function describeServerPaging(pagination: Pagination | null): PagingSummary {
  if (!pagination || pagination.total === 0) {
    return { pageIndex: 0, pageCount: 1, offset: 0, hasPrevious: false, hasNext: false, rangeText: '0 of 0' };
  }
  const pageCount = Math.max(1, pagination.lastPage);
  const pageIndex = Math.min(Math.max(0, pagination.currentPage - 1), pageCount - 1);
  return {
    pageIndex,
    pageCount,
    offset: (pagination.from ?? 1) - 1,
    hasPrevious: pageIndex > 0,
    hasNext: pageIndex < pageCount - 1,
    rangeText: `${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total}`,
  };
}

/** "22 entries", or "3 found" while a filter is typed. */
export function describeHistoryCount(total: number, isFiltered: boolean): string {
  return isFiltered ? `${total} found` : `${total} ${total === 1 ? 'entry' : 'entries'}`;
}
