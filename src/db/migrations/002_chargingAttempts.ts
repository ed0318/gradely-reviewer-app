import type { Migration } from './migration';

/**
 * Phase 6: what an exam attempt needs beyond the first schema.
 *
 * - `charging` joins the statuses: an attempt is saved before the server is
 *   asked to charge for it, and stays so until the answer (or a retry) comes.
 * - `source_attempt_id` and `only_missed` say where a retake's questions come
 *   from, so a charge that was cut short can be finished after a restart.
 * - `current_position` and `elapsed_seconds` let a killed exam resume at the
 *   same question with its time kept.
 * - `attempt_answers.is_flagged` is the "come back to this" mark.
 *
 * A CHECK cannot be changed in place, so `exam_attempts` is rebuilt. Rebuilding
 * a table that others point at, with foreign keys on, would cascade-delete the
 * children when the old table is dropped. So the three attempt tables are
 * copied aside, dropped child first, made again and refilled, all inside the
 * migration's own transaction: nothing is lost, and a failure rolls it all back.
 */
export const chargingAttempts: Migration = {
  version: 2,
  sql: `
CREATE TABLE migrating_attempts AS SELECT * FROM exam_attempts;
CREATE TABLE migrating_attempt_questions AS SELECT * FROM attempt_questions;
CREATE TABLE migrating_attempt_answers AS SELECT * FROM attempt_answers;

DROP TABLE attempt_answers;
DROP TABLE attempt_questions;
DROP TABLE exam_attempts;

CREATE TABLE exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  charge_id TEXT NOT NULL UNIQUE,                                             -- The idempotency key the server charged under.
  units_charged INTEGER NOT NULL CHECK (units_charged >= 0),
  scheduled_at INTEGER,
  remind_minutes_before INTEGER,
  notification_id TEXT,                                                       -- The local reminder, to cancel it.
  started_at INTEGER,
  finished_at INTEGER,
  score REAL,
  total_points REAL,
  status TEXT NOT NULL CHECK (status IN ('charging', 'scheduled', 'ready', 'in_progress', 'finished')),
  source_attempt_id TEXT,                                                     -- A retake copies its questions from this attempt; null: from the topic.
  only_missed INTEGER NOT NULL DEFAULT 0,                                     -- 1: only the questions that attempt got wrong.
  current_position INTEGER NOT NULL DEFAULT 0,                                -- Index of the question on screen, to resume.
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,                                 -- Time taken, paused while the app is away.
  UNIQUE (exam_id, attempt_number)
);
CREATE INDEX exam_attempts__exam_finished ON exam_attempts(exam_id, finished_at);
CREATE INDEX exam_attempts__status_finished ON exam_attempts(status, finished_at);

CREATE TABLE attempt_questions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple', 'truefalse', 'identification', 'essay')),
  question TEXT NOT NULL,
  point REAL NOT NULL,
  answer TEXT,
  choices TEXT,
  UNIQUE (attempt_id, position)
);

CREATE TABLE attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_question_id TEXT NOT NULL UNIQUE REFERENCES attempt_questions(id) ON DELETE CASCADE,
  given_answer TEXT,
  is_correct INTEGER,                                                         -- Null until an essay is self-marked.
  is_flagged INTEGER NOT NULL DEFAULT 0
);

INSERT INTO exam_attempts (id, exam_id, attempt_number, charge_id, units_charged, scheduled_at, remind_minutes_before,
                           notification_id, started_at, finished_at, score, total_points, status)
  SELECT id, exam_id, attempt_number, charge_id, units_charged, scheduled_at, remind_minutes_before,
         notification_id, started_at, finished_at, score, total_points, status
    FROM migrating_attempts;
INSERT INTO attempt_questions (id, attempt_id, position, type, question, point, answer, choices)
  SELECT id, attempt_id, position, type, question, point, answer, choices FROM migrating_attempt_questions;
INSERT INTO attempt_answers (id, attempt_question_id, given_answer, is_correct)
  SELECT id, attempt_question_id, given_answer, is_correct FROM migrating_attempt_answers;

DROP TABLE migrating_attempt_answers;
DROP TABLE migrating_attempt_questions;
DROP TABLE migrating_attempts;
`,
};
