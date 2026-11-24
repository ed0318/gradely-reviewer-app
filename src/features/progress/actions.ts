import { openDatabase } from '@/db/client';
import { countExamAttempts } from '@/db/repositories/exams';
import {
  getExamProgressStats,
  listFinishedAttemptScoresPage,
  listLatestFinishedScores,
  listProgressExams,
  type ExamProgressStats,
  type FinishedAttemptScore,
  type ProgressExam,
} from '@/db/repositories/progress';
import { calculatePercent } from '@/features/exams/formatExam';
import { CHART_BAR_COUNT, type ChartInput } from './chartBars';
import { ATTEMPTS_PAGE_SIZE } from './paging';

/**
 * Reads for the Progress tab. All of it comes from the phone's database, so the
 * tab works with no connection; one query for each block the screen shows.
 */

export type ExamSummary = {
  stats: ExamProgressStats;
  /** The last attempts, oldest first, ready for the chart. */
  chart: ChartInput[];
};

export async function loadProgressExams(): Promise<ProgressExam[]> {
  return listProgressExams(await openDatabase());
}

/** The stats row and the chart's bars: two queries, one for each. */
export async function loadExamSummary(examId: string): Promise<ExamSummary> {
  const database = await openDatabase();
  const [stats, latest] = await Promise.all([getExamProgressStats(database, examId), listLatestFinishedScores(database, examId, CHART_BAR_COUNT)]);
  const chart = latest.map((attempt) => ({ attemptNumber: attempt.attemptNumber, percent: calculatePercent(attempt.score, attempt.totalPoints) })).reverse();
  return { stats, chart };
}

/** A page of the attempts table, with the time it was read (it only decides whether a date shows its year). */
export type AttemptsPage = { attempts: FinishedAttemptScore[]; loadedAt: number };

/** One page of the attempts table, newest first. */
export async function loadAttemptsPage(examId: string, pageIndex: number): Promise<AttemptsPage> {
  const attempts = await listFinishedAttemptScoresPage(await openDatabase(), examId, { limit: ATTEMPTS_PAGE_SIZE, offset: pageIndex * ATTEMPTS_PAGE_SIZE });
  return { attempts, loadedAt: Date.now() };
}

/** How many attempts deleting this exam removes, for its confirmation. */
export async function loadAttemptCountForDelete(examId: string): Promise<number> {
  return countExamAttempts(await openDatabase(), examId);
}
