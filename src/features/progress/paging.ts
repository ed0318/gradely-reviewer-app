/** Ten attempts to a page of the Progress table. */
export const ATTEMPTS_PAGE_SIZE = 10;

export type PagingSummary = {
  /** The page shown, 0-based, kept inside what exists. */
  pageIndex: number;
  pageCount: number;
  /** Where the page starts, for `OFFSET`. */
  offset: number;
  hasPrevious: boolean;
  hasNext: boolean;
  /** "1–10 of 23", or "0 of 0" when there is nothing. */
  rangeText: string;
};

/** Page arithmetic for a table of `total` rows. A page past the end is pulled back to the last one. */
export function describePaging(total: number, requestedPageIndex: number, pageSize: number = ATTEMPTS_PAGE_SIZE): PagingSummary {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageIndex = Math.min(Math.max(0, requestedPageIndex), pageCount - 1);
  const offset = pageIndex * pageSize;
  const rangeText = total === 0 ? '0 of 0' : `${offset + 1}–${Math.min(total, offset + pageSize)} of ${total}`;
  return { pageIndex, pageCount, offset, hasPrevious: pageIndex > 0, hasNext: pageIndex < pageCount - 1, rangeText };
}
