import type { SQLiteDatabase } from 'expo-sqlite';
import type { DirectionsMode, PageRequest, QuestionType, SectionDirection, Topic, TopicListItem, TopicSource } from '../records';

type TopicRow = {
  id: string;
  title: string;
  subject_label: string | null;
  general_directions: string;
  source: TopicSource;
  source_ref: string | null;
  created_at: number;
  updated_at: number;
};

const toTopic = (row: TopicRow): Topic => ({
  id: row.id,
  title: row.title,
  subjectLabel: row.subject_label,
  generalDirections: row.general_directions,
  source: row.source,
  sourceRef: row.source_ref,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function insertTopic(database: SQLiteDatabase, topic: Topic): Promise<void> {
  await database.runAsync(
    `INSERT INTO topics (id, title, subject_label, general_directions, source, source_ref, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    topic.id,
    topic.title,
    topic.subjectLabel,
    topic.generalDirections,
    topic.source,
    topic.sourceRef,
    topic.createdAt,
    topic.updatedAt,
  );
}

export type TopicHeader = Pick<Topic, 'title' | 'subjectLabel' | 'generalDirections'>;

/** Saves the title, subject and directions. False when the topic is gone. */
export async function updateTopicHeader(database: SQLiteDatabase, topicId: string, header: TopicHeader, now: number): Promise<boolean> {
  const result = await database.runAsync(
    'UPDATE topics SET title = ?, subject_label = ?, general_directions = ?, updated_at = ? WHERE id = ?',
    header.title,
    header.subjectLabel,
    header.generalDirections,
    now,
    topicId,
  );
  return result.changes > 0;
}

export async function getTopic(database: SQLiteDatabase, topicId: string): Promise<Topic | null> {
  const row = await database.getFirstAsync<TopicRow>('SELECT * FROM topics WHERE id = ?', topicId);
  return row ? toTopic(row) : null;
}

/** The Topics list, most recently edited first, with each topic's question count. */
export async function listTopicsPage(database: SQLiteDatabase, page: PageRequest): Promise<TopicListItem[]> {
  const rows = await database.getAllAsync<{ id: string; title: string; subject_label: string | null; updated_at: number; question_count: number }>(
    `SELECT t.id, t.title, t.subject_label, t.updated_at,
            (SELECT COUNT(*) FROM topic_questions q WHERE q.topic_id = t.id) AS question_count
       FROM topics t
      ORDER BY t.updated_at DESC, t.id
      LIMIT ? OFFSET ?`,
    page.limit,
    page.offset,
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subjectLabel: row.subject_label,
    updatedAt: row.updated_at,
    questionCount: row.question_count,
  }));
}

export async function countTopics(database: SQLiteDatabase): Promise<number> {
  const row = await database.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM topics');
  return row?.total ?? 0;
}

/** Deletes the topic and its questions. Its exams keep their attempts and scores, with no topic. */
export async function deleteTopic(database: SQLiteDatabase, topicId: string): Promise<boolean> {
  const result = await database.runAsync('DELETE FROM topics WHERE id = ?', topicId);
  return result.changes > 0;
}

export async function listSectionDirections(database: SQLiteDatabase, topicId: string): Promise<SectionDirection[]> {
  const rows = await database.getAllAsync<{ question_type: QuestionType; mode: DirectionsMode; text: string }>(
    'SELECT question_type, mode, text FROM topic_section_directions WHERE topic_id = ? ORDER BY question_type',
    topicId,
  );
  return rows.map((row) => ({ questionType: row.question_type, mode: row.mode, text: row.text }));
}

/** Sets the directions above one question type's section, replacing any before. */
export async function saveSectionDirection(
  database: SQLiteDatabase,
  rowId: string,
  topicId: string,
  direction: SectionDirection,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO topic_section_directions (id, topic_id, question_type, mode, text) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (topic_id, question_type) DO UPDATE SET mode = excluded.mode, text = excluded.text`,
    rowId,
    topicId,
    direction.questionType,
    direction.mode,
    direction.text,
  );
}
