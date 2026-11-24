/** What a topic's header form holds, as typed. */
export type TopicHeaderInput = { title: string; subject: string; directions: string };

/** Why the header cannot be saved yet, or null when it can. */
export function findTopicHeaderProblem(input: TopicHeaderInput): string | null {
  return input.title.trim() ? null : 'Give the topic a title.';
}

/** The header as stored: trimmed, an empty subject as null. */
export function toTopicHeader(input: TopicHeaderInput) {
  return { title: input.title.trim(), subjectLabel: input.subject.trim() || null, generalDirections: input.directions.trim() };
}
