import type { Migration } from './migration';

/**
 * The first schema. Topics and their questions copy gradely-app's exam tables
 * column for column (exams → topics, exam_questions → topic_questions, and so
 * on), so a Gradely exam can be saved as a topic later without conversion.
 *
 * Ids are UUID text. Times are epoch ms. Credits are integer units (1 credit =
 * 4 units), never REAL.
 */
export const initialSchema: Migration = {
  version: 1,
  sql: `
/* Topics: what the student writes ----------------------------------------- */

CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_label TEXT,                                                         -- Optional free text under the title.
  general_directions TEXT NOT NULL,                                           -- Shown once above the first section. May be empty.
  source TEXT NOT NULL DEFAULT 'own' CHECK (source IN ('own', 'marketplace')),
  source_ref TEXT,                                                            -- The marketplace listing it came from, later.
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE topic_section_directions (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple', 'truefalse', 'identification', 'essay')),
  mode TEXT NOT NULL CHECK (mode IN ('template', 'custom', 'none')),
  text TEXT NOT NULL,
  UNIQUE (topic_id, question_type)                                            -- Also the index on topic_id.
);

CREATE TABLE topic_questions (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,                                                                -- Identification only. Other types use the tables below.
  type TEXT NOT NULL CHECK (type IN ('multiple', 'truefalse', 'identification', 'essay')),
  point REAL NOT NULL,
  sorting_order INTEGER NOT NULL
);
CREATE INDEX topic_questions__topic_order ON topic_questions(topic_id, sorting_order);

CREATE TABLE topic_question_answer_multiple (
  id TEXT PRIMARY KEY,
  topic_question_id TEXT NOT NULL REFERENCES topic_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL,                                                -- 1 on the right option. Exactly one per question.
  sort_order INTEGER NOT NULL                                                 -- The letter comes from it and is not stored.
);
CREATE INDEX topic_question_answer_multiple__question_order ON topic_question_answer_multiple(topic_question_id, sort_order);

CREATE TABLE topic_question_answer_true_false (
  id TEXT PRIMARY KEY,
  topic_question_id TEXT NOT NULL UNIQUE REFERENCES topic_questions(id) ON DELETE CASCADE,
  answer_is_true INTEGER NOT NULL
);

CREATE TABLE topic_question_answer_essay (
  id TEXT PRIMARY KEY,
  topic_question_id TEXT NOT NULL UNIQUE REFERENCES topic_questions(id) ON DELETE CASCADE,
  answer_guide TEXT,
  no_lines INTEGER NOT NULL
);

/* Exams: a paid set of items from a topic ----------------------------------- */

CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,                     -- Null once the topic is deleted; scores stay.
  name TEXT NOT NULL,
  item_count INTEGER NOT NULL CHECK (item_count BETWEEN 1 AND 100),
  shuffle_questions INTEGER NOT NULL,
  shuffle_choices INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX exams__topic_id ON exams(topic_id);
CREATE INDEX exams__created_at ON exams(created_at);

-- One paid sitting. A retake is a new row with a new charge_id.
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
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'ready', 'in_progress', 'finished')),
  UNIQUE (exam_id, attempt_number)
);
CREATE INDEX exam_attempts__exam_finished ON exam_attempts(exam_id, finished_at);
CREATE INDEX exam_attempts__status_finished ON exam_attempts(status, finished_at);

-- Each question as it was when the attempt was made.
CREATE TABLE attempt_questions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple', 'truefalse', 'identification', 'essay')),
  question TEXT NOT NULL,
  point REAL NOT NULL,
  answer TEXT,                                                                -- identification answer, 'true'/'false', or the essay guide.
  choices TEXT,                                                               -- multiple only: JSON [{choiceText, isCorrect}] in shown order.
  UNIQUE (attempt_id, position)                                               -- Also the index on attempt_id.
);

CREATE TABLE attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_question_id TEXT NOT NULL UNIQUE REFERENCES attempt_questions(id) ON DELETE CASCADE,
  given_answer TEXT,
  is_correct INTEGER                                                          -- Null until an essay is self-marked.
);

/* The account on this phone ------------------------------------------------- */

CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),                                      -- One row at most.
  account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_path TEXT                                                             -- A file path, never the image itself.
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),                                      -- Always exactly one row.
  low_credit_alert_on INTEGER NOT NULL,
  low_credit_threshold_units INTEGER NOT NULL CHECK (low_credit_threshold_units >= 0),
  low_credit_alerted INTEGER NOT NULL,                                        -- 1 once alerted, until the balance rises above the threshold.
  balance_units_cache INTEGER,                                                -- The last balance the server reported.
  balance_checked_at INTEGER
);
-- Alert on, at 10 credits.
INSERT INTO settings (id, low_credit_alert_on, low_credit_threshold_units, low_credit_alerted) VALUES (1, 1, 40, 0);
`,
};
