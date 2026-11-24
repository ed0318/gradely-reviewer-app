import { chargeExam } from '@/api/credits';
import { openDatabase, queueWrite } from '@/db/client';
import {
  completeChargedAttempt,
  discardChargingAttempt,
  findChargingRetake,
  insertChargingAttempt,
  listAttemptAnswers,
  listAttemptNotificationIds,
  listAttemptQuestions,
  listChargingAttemptIds,
  listRemindableAttempts,
  saveAttemptNotificationId,
} from '@/db/repositories/attempts';
import { deleteExam, getAttemptWithExam, insertChargingExam } from '@/db/repositories/exams';
import { listQuestionIdsByTopic, listQuestionsByIds } from '@/db/repositories/questions';
import type { AttemptQuestion, Exam, ExamAttempt } from '@/db/records';
import { checkLowCredit } from '@/features/credits/actions';
import { calculateExamCostUnits } from '@/lib/creditUnits';
import { createId } from '@/lib/ids';
import { cancelExamReminders, listHeldReminderIds, scheduleExamReminder } from '@/notifications/examReminders';
import { isChargeStillPending, settleCharge, type ChargeOutcome, type ChargePorts, type PendingCharge } from './chargeFlow';
import { announceExamsChanged } from './examsChangeSignal';
import { arrangeAttemptQuestions, draftFromAttemptQuestion, draftFromTopicQuestion, pickQuestionIds, type QuestionDraft, type RandomSource } from './pickExamQuestions';
import { findMissedQuestions } from './scoreAttempt';
import { computeReminderAt } from './scheduleTimes';

/**
 * Making an exam or a retake: save the attempt as `charging`, settle the charge
 * with the server (see `chargeFlow.ts`), and finish the exam once it is paid.
 * Credits are the server's; this only asks and records its answer.
 */

export type NewExamPlan = {
  examName: string;
  topicId: string;
  itemCount: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  /** Null: start right away. */
  schedule: { scheduledAt: number; remindMinutesBefore: number | null } | null;
};

export type RetakeMode = 'shuffled' | 'missed';
export type RetakePlan = { sourceAttemptId: string; mode: RetakeMode };

export type ChargeRunOptions = {
  /** Told the server's balance the moment it reports one. */
  onBalance: (balanceUnits: number) => void;
  signal?: AbortSignal;
};

const MAX_HELD_REMINDERS = 60;

function buildChargingAttempt(examId: string, itemCount: number, extras: Partial<ExamAttempt> = {}): ExamAttempt {
  return {
    id: createId(),
    examId,
    attemptNumber: 1,
    chargeId: createId(),
    unitsCharged: calculateExamCostUnits(itemCount),
    scheduledAt: null,
    remindMinutesBefore: null,
    notificationId: null,
    startedAt: null,
    finishedAt: null,
    score: null,
    totalPoints: null,
    status: 'charging',
    sourceAttemptId: null,
    onlyMissed: false,
    currentPosition: 0,
    elapsedSeconds: 0,
    ...extras,
  };
}

/** Steps 1 of the flow: saves the exam and its first attempt as `charging`, with the key the server will see. */
export async function savePendingExam(plan: NewExamPlan, now: number = Date.now()): Promise<PendingCharge> {
  const exam: Exam = {
    id: createId(),
    topicId: plan.topicId,
    name: plan.examName.trim(),
    itemCount: plan.itemCount,
    shuffleQuestions: plan.shuffleQuestions,
    shuffleChoices: plan.shuffleChoices,
    createdAt: now,
  };
  const attempt = buildChargingAttempt(exam.id, plan.itemCount, {
    scheduledAt: plan.schedule?.scheduledAt ?? null,
    remindMinutesBefore: plan.schedule?.remindMinutesBefore ?? null,
  });
  await queueWrite((database) => insertChargingExam(database, exam, attempt));
  return { attemptId: attempt.id, chargeId: attempt.chargeId, examName: exam.name, itemCount: plan.itemCount };
}

/** The same for a retake: a new attempt of an existing exam, with its own key. Null when the source attempt is gone or has nothing to retake. */
export async function savePendingRetake(plan: RetakePlan): Promise<PendingCharge | null> {
  const database = await openDatabase();
  const source = await getAttemptWithExam(database, plan.sourceAttemptId);
  if (!source) return null;
  const waiting = await findChargingRetake(database, source.exam.id, plan.sourceAttemptId, plan.mode === 'missed');
  if (waiting) return { attemptId: waiting.id, chargeId: waiting.chargeId, examName: source.exam.name, itemCount: waiting.unitsCharged };
  const questions = await listAttemptQuestions(database, plan.sourceAttemptId);
  const itemCount = plan.mode === 'missed' ? findMissedQuestions(questions, await listAttemptAnswers(database, plan.sourceAttemptId)).length : questions.length;
  if (itemCount === 0) return null;

  const attempt = buildChargingAttempt(source.exam.id, itemCount, { sourceAttemptId: plan.sourceAttemptId, onlyMissed: plan.mode === 'missed' });
  const saved = await queueWrite((writer) => insertChargingAttempt(writer, attempt));
  return { attemptId: saved.id, chargeId: saved.chargeId, examName: source.exam.name, itemCount };
}

/** Where a charged attempt's questions come from, as drafts. Empty when there is nothing left to pick from. */
async function collectDrafts(attempt: ExamAttempt, exam: Exam, random: RandomSource): Promise<QuestionDraft[]> {
  const database = await openDatabase();
  if (attempt.sourceAttemptId) {
    const questions = await listAttemptQuestions(database, attempt.sourceAttemptId);
    const chosen = attempt.onlyMissed ? findMissedQuestions(questions, await listAttemptAnswers(database, attempt.sourceAttemptId)) : questions;
    return chosen.map(draftFromAttemptQuestion);
  }
  if (!exam.topicId) return [];
  const pickedIds = pickQuestionIds(await listQuestionIdsByTopic(database, exam.topicId), attempt.unitsCharged, random);
  return (await listQuestionsByIds(database, pickedIds)).map(draftFromTopicQuestion);
}

/**
 * Step 3 of the flow: picks the questions, copies them into the attempt and
 * marks it ready or scheduled, in one transaction. Then sets the reminder.
 */
export async function buildChargedAttempt(attemptId: string, random: RandomSource = Math.random): Promise<'built' | 'already_built' | 'source_missing'> {
  const found = await getAttemptWithExam(await openDatabase(), attemptId);
  if (!found || found.attempt.status !== 'charging') return 'already_built';
  const { attempt, exam } = found;

  const drafts = await collectDrafts(attempt, exam, random);
  if (drafts.length === 0) return 'source_missing';

  // A shuffled retake always reshuffles; the missed-only retake and a first attempt follow the exam's own switches.
  const isShuffledRetake = attempt.sourceAttemptId !== null && !attempt.onlyMissed;
  const questions: AttemptQuestion[] = arrangeAttemptQuestions(
    attempt.id,
    drafts,
    { shuffleQuestions: isShuffledRetake || exam.shuffleQuestions, shuffleChoices: isShuffledRetake || exam.shuffleChoices },
    random,
    createId,
  );
  const isScheduled = attempt.scheduledAt !== null;
  const isCompleted = await queueWrite((database) => completeChargedAttempt(database, attempt.id, questions, isScheduled ? 'scheduled' : 'ready'));
  if (isCompleted && isScheduled) await setReminderFor(attempt, exam.name, questions.length);
  return isCompleted ? 'built' : 'already_built';
}

async function setReminderFor(attempt: ExamAttempt, examName: string, itemCount: number): Promise<void> {
  if (attempt.scheduledAt === null || attempt.remindMinutesBefore === null) return;
  const notificationId = await scheduleExamReminder({
    attemptId: attempt.id,
    examName,
    itemCount,
    scheduledAt: attempt.scheduledAt,
    remindMinutesBefore: attempt.remindMinutesBefore,
  });
  if (notificationId) await queueWrite((database) => saveAttemptNotificationId(database, attempt.id, notificationId));
}

/** One run per attempt at a time: the screen's own run and the app-open retry must not both charge. */
const runsInFlight = new Map<string, Promise<ChargeOutcome>>();

/**
 * Steps 2 to 5: asks the server to charge under the attempt's own key and acts
 * on the answer. Safe to call again for an attempt left `charging`: the same
 * key goes out, and the server never charges twice.
 */
export function runCharge(pending: PendingCharge, options: ChargeRunOptions): Promise<ChargeOutcome> {
  const running = runsInFlight.get(pending.attemptId);
  if (running) return running;

  const ports: ChargePorts = {
    requestCharge: async (charge) => {
      const charged = await chargeExam({ ...charge, signal: options.signal });
      return { balanceUnits: charged.balanceUnits };
    },
    applyBalance: options.onBalance,
    buildAttempt: (attemptId) => buildChargedAttempt(attemptId),
    discardAttempt: async (attemptId) => {
      await queueWrite((database) => discardChargingAttempt(database, attemptId));
    },
  };
  const run = settleCharge(pending, ports)
    .then(async (outcome) => {
      if (outcome.kind === 'ready' || outcome.kind === 'source_missing') {
        announceExamsChanged();
        void checkLowCredit(outcome.balanceUnits).catch((error: unknown) => console.warn('[reviewer] low credit check failed', error));
      } else if (!isChargeStillPending(outcome)) {
        announceExamsChanged();
      }
      return outcome;
    })
    .finally(() => runsInFlight.delete(pending.attemptId));
  runsInFlight.set(pending.attemptId, run);
  return run;
}

/** Reads a saved `charging` attempt back into what `runCharge` needs. Null if it is no longer charging. */
export async function loadPendingCharge(attemptId: string): Promise<PendingCharge | null> {
  const found = await getAttemptWithExam(await openDatabase(), attemptId);
  if (!found || found.attempt.status !== 'charging') return null;
  return { attemptId, chargeId: found.attempt.chargeId, examName: found.exam.name, itemCount: found.attempt.unitsCharged };
}

/**
 * Settles every attempt left `charging` (the phone was offline, or the app was
 * closed mid-charge). Stops at the first one the server cannot be reached for.
 */
export async function retryPendingCharges(options: ChargeRunOptions): Promise<ChargeOutcome[]> {
  const outcomes: ChargeOutcome[] = [];
  for (const attemptId of await listChargingAttemptIds(await openDatabase())) {
    if (options.signal?.aborted) break;
    const pending = await loadPendingCharge(attemptId);
    if (!pending) continue;
    const outcome = await runCharge(pending, options);
    outcomes.push(outcome);
    if (isChargeStillPending(outcome)) break;
  }
  return outcomes;
}

/**
 * Makes sure the phone holds a reminder for each scheduled exam that wants one:
 * after a restart, a reinstall of notifications, or a reminder that could not be
 * set when the exam was made. Only the soonest few are held (iOS keeps 64).
 */
export async function reconcileExamReminders(now: number = Date.now()): Promise<void> {
  const remindable = await listRemindableAttempts(await openDatabase(), MAX_HELD_REMINDERS);
  const held = await listHeldReminderIds();
  for (const item of remindable) {
    if (item.notificationId && held.has(item.notificationId)) continue;
    if (computeReminderAt(item.scheduledAt, item.remindMinutesBefore, now) === null) continue;
    const notificationId = await scheduleExamReminder(
      { attemptId: item.attemptId, examName: item.examName, itemCount: item.itemCount, scheduledAt: item.scheduledAt, remindMinutesBefore: item.remindMinutesBefore },
      now,
    );
    if (notificationId) await queueWrite((database) => saveAttemptNotificationId(database, item.attemptId, notificationId));
  }
}

/**
 * Deletes the exam with its attempts and scores and cancels its reminders. The
 * topic stays and nothing is refunded.
 */
export async function removeExam(examId: string): Promise<boolean> {
  const notificationIds = await listAttemptNotificationIds(await openDatabase(), examId);
  await cancelExamReminders(notificationIds);
  const isRemoved = await queueWrite((database) => deleteExam(database, examId));
  announceExamsChanged();
  return isRemoved;
}
