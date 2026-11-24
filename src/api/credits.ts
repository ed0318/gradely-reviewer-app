import { requestList, requestResult, type Pagination } from './client';

/** Credits are integer units (1 credit = 4 units; an exam item costs 1 unit, 0.25 credit). */

export type ExamChargeRequest = {
  /** A UUID made once per exam or retake and reused on every retry, so a retry never charges twice. */
  idempotencyKey: string;
  examName: string;
  itemCount: number;
  /** The caller's abort, e.g. when the screen closes. The key stays valid, so a later retry is safe. */
  signal?: AbortSignal;
};

export type ExamCharge = {
  /** The server's ledger row id. The local `exam_attempts.charge_id` is the idempotency key, not this. */
  transactionId: number;
  idempotencyKey: string;
  examName: string;
  itemCount: number;
  unitsCharged: number;
  balanceUnits: number;
  /** True when the server had already charged this key and answered with the first result. */
  isReplay: boolean;
  chargedAt: string | null;
};

type ExamChargePayload = {
  charge_id: number;
  idempotency_key: string;
  exam_name: string;
  item_count: number;
  units_charged: number;
  balance_units: number;
  is_replay: boolean;
  charged_at: string | null;
};

/**
 * Charges for an exam before it is built. Throws `ApiError` with code
 * `insufficient_credits` (402) when the balance is short, and `OfflineError`
 * when the server could not be reached: no exam is made offline.
 */
export async function chargeExam(charge: ExamChargeRequest): Promise<ExamCharge> {
  const payload = await requestResult<ExamChargePayload>('/exams/charge', {
    method: 'POST',
    body: { idempotency_key: charge.idempotencyKey, exam_name: charge.examName, item_count: charge.itemCount },
    signal: charge.signal,
  });
  return {
    transactionId: payload.charge_id,
    idempotencyKey: payload.idempotency_key,
    examName: payload.exam_name,
    itemCount: payload.item_count,
    unitsCharged: payload.units_charged,
    balanceUnits: payload.balance_units,
    isReplay: payload.is_replay,
    chargedAt: payload.charged_at,
  };
}

export type CreditTransactionType = 'purchase' | 'exam_charge' | 'adjustment' | 'refund';

export type CreditTransaction = {
  id: number;
  type: CreditTransactionType;
  /** Signed: negative for a charge. */
  units: number;
  balanceAfterUnits: number;
  examName: string | null;
  itemCount: number | null;
  createdAt: string | null;
};

type CreditTransactionPayload = {
  id: number;
  type: CreditTransactionType;
  units: number;
  balance_after_units: number;
  exam_name: string | null;
  item_count: number | null;
  created_at: string | null;
};

export type CreditTransactionQuery = {
  page: number;
  search?: string;
  sort?: 'newest' | 'oldest';
  perPage?: number;
  signal?: AbortSignal;
};

export const CREDIT_HISTORY_PAGE_SIZE = 10;

/** Credit history, 10 a page by default, searchable by exam name. */
export async function listCreditTransactions(query: CreditTransactionQuery): Promise<{ transactions: CreditTransaction[]; pagination: Pagination | null }> {
  const { results, pagination } = await requestList<CreditTransactionPayload>('/credits/transactions', {
    query: {
      page: query.page,
      per_page: query.perPage ?? CREDIT_HISTORY_PAGE_SIZE,
      search: query.search?.trim(),
      sort: query.sort ?? 'newest',
    },
    signal: query.signal,
  });
  return {
    transactions: results.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      units: transaction.units,
      balanceAfterUnits: transaction.balance_after_units,
      examName: transaction.exam_name,
      itemCount: transaction.item_count,
      createdAt: transaction.created_at,
    })),
    pagination,
  };
}
