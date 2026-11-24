import { QUESTION_TYPES, type QuestionType, type TopicQuestion } from '../records';

/**
 * DEV ONLY. The mockup's topics as plain data, with a realistic mix of the four
 * question types, plus one generated topic big enough to check list scrolling.
 * Written by `seedDummyTopics.ts`; delete `src/db/dev` to remove all of it.
 */

export type DummyTopic = {
  id: string;
  title: string;
  subjectLabel: string;
  generalDirections: string;
  questions: TopicQuestion[];
};

type Draft = { type: QuestionType; build: (id: string, topicId: string, sortingOrder: number) => TopicQuestion };

const multiple = (question: string, choices: string[], correctIndex: number, point = 1): Draft => ({
  type: 'multiple',
  build: (id, topicId, sortingOrder) => ({
    id,
    topicId,
    question,
    point,
    sortingOrder,
    type: 'multiple',
    choices: choices.map((choiceText, index) => ({ id: `${id}:c${index}`, choiceText, isCorrect: index === correctIndex })),
  }),
});

const trueFalse = (question: string, answerIsTrue: boolean, point = 1): Draft => ({
  type: 'truefalse',
  build: (id, topicId, sortingOrder) => ({ id, topicId, question, point, sortingOrder, type: 'truefalse', answerIsTrue }),
});

const identification = (question: string, answer: string, point = 1): Draft => ({
  type: 'identification',
  build: (id, topicId, sortingOrder) => ({ id, topicId, question, point, sortingOrder, type: 'identification', answer }),
});

const essay = (question: string, answerGuide: string | null, lines: number, point = 5): Draft => ({
  type: 'essay',
  build: (id, topicId, sortingOrder) => ({ id, topicId, question, point, sortingOrder, type: 'essay', answerGuide, lines }),
});

const typeRank = (type: QuestionType) => QUESTION_TYPES.indexOf(type);

/** Builds the questions in section order, which is how a topic keeps `sorting_order`. */
function buildQuestions(topicId: string, drafts: Draft[]): TopicQuestion[] {
  const ordered = drafts
    .map((draft, index) => ({ draft, index }))
    .sort((a, b) => typeRank(a.draft.type) - typeRank(b.draft.type) || a.index - b.index);
  return ordered.map(({ draft, index }, sortingOrder) => draft.build(`${topicId}:q${index + 1}`, topicId, sortingOrder));
}

const CIVIL_SERVICE: Draft[] = [
  multiple('If 3x + 5 = 20, what is the value of x?', ['3', '5', '15', '25'], 1),
  multiple('What is 15% of 240?', ['24', '30', '36', '40'], 2),
  multiple('A shirt marked ₱800 is sold at a 25% discount. What is the sale price?', ['₱200', '₱560', '₱600', '₱775'], 2),
  multiple('What is the next number in the series 2, 6, 12, 20, 30, ...?', ['36', '40', '42', '48'], 2),
  multiple('Which fraction is the largest?', ['3/8', '5/12', '7/16', '2/5'], 2),
  multiple('A train travels 180 km in 2.5 hours. What is its average speed?', ['62 km/h', '68 km/h', '72 km/h', '75 km/h'], 2),
  multiple('The ratio of boys to girls in a class is 3:5. If there are 40 students, how many are girls?', ['15', '20', '25', '30'], 2, 2),
  trueFalse('Every prime number is odd.', false),
  trueFalse('The sum of two even numbers is always even.', true),
  trueFalse('0.5 is equal to 1/2.', true),
  identification('What do you call the result of dividing one number by another?', 'Quotient'),
  identification('What is the top number of a fraction called?', 'Numerator'),
  identification('What is the least common multiple of 4 and 6?', '12', 2),
  essay('Explain how to find the original price of an item after a 10% discount.', 'Divide the sale price by 0.90, or set up SP = 0.90 × OP and solve for OP. A worked example earns full points.', 6),
  essay('Describe two ways to check that your answer to a word problem makes sense.', null, 5, 3),
];

const LET_ENGLISH: Draft[] = [
  multiple('Choose the sentence with correct subject-verb agreement.', ['The list of items are on the desk.', 'The list of items is on the desk.', 'The lists of items is on the desk.', 'The list of items were on the desk.'], 1),
  multiple('Which word is a synonym of "ephemeral"?', ['Lasting', 'Fleeting', 'Ancient', 'Solid'], 1),
  multiple('Which figure of speech is "The wind whispered through the trees"?', ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], 2),
  multiple('Identify the correct spelling.', ['Accomodate', 'Acommodate', 'Accommodate', 'Acomodate'], 2),
  multiple('"She has lived here since 2015." The verb is in which tense?', ['Simple past', 'Present perfect', 'Past perfect', 'Present continuous'], 1),
  multiple('Who wrote "Noli Me Tangere"?', ['Andres Bonifacio', 'Marcelo H. del Pilar', 'Jose Rizal', 'Graciano Lopez Jaena'], 2),
  multiple('Which is the topic sentence of a paragraph?', ['The last sentence', 'The sentence that states the main idea', 'Any supporting detail', 'A quotation'], 1),
  trueFalse('A simile uses "like" or "as" to compare two things.', true),
  trueFalse('"Their", "there" and "they\'re" are homonyms.', true),
  trueFalse('A run-on sentence is a sentence that is too short.', false),
  identification('What is the term for a word that is opposite in meaning to another word?', 'Antonym'),
  identification('What part of speech modifies a verb?', 'Adverb'),
  identification('Who is the author of "El Filibusterismo"?', 'Jose Rizal'),
  essay('Discuss how reading literature can improve a learner\'s communication skills.', 'Mentions vocabulary growth, models of structure and voice, empathy, and at least one concrete classroom example.', 8, 10),
];

const PHARMACOLOGY: Draft[] = [
  multiple('Which drug class is first-line for most cases of hypertension in a patient with diabetes?', ['ACE inhibitors', 'Alpha agonists', 'Loop diuretics', 'Calcium chelators'], 0),
  multiple('Which of the following is an opioid antagonist?', ['Morphine', 'Naloxone', 'Codeine', 'Tramadol'], 1),
  multiple('The antidote for acetaminophen overdose is:', ['Flumazenil', 'Atropine', 'N-acetylcysteine', 'Protamine sulfate'], 2),
  multiple('Which route of administration avoids first-pass metabolism?', ['Oral', 'Sublingual', 'Rectal, then swallowed', 'Enteral tube'], 1),
  multiple('A common adverse effect of ACE inhibitors is:', ['Dry cough', 'Constipation', 'Tinnitus', 'Gingival overgrowth'], 0),
  multiple('Warfarin\'s effect is monitored with which laboratory test?', ['aPTT', 'INR', 'Platelet count', 'Hemoglobin A1c'], 1, 2),
  trueFalse('Penicillins are effective against viral infections.', false),
  trueFalse('Grapefruit juice can raise the blood level of some drugs.', true),
  trueFalse('The half-life of a drug is the time for its plasma concentration to fall by half.', true),
  identification('What is the term for the study of what the body does to a drug?', 'Pharmacokinetics'),
  identification('What is the antidote for heparin overdose?', 'Protamine sulfate', 2),
  identification('Which vitamin is needed to reverse warfarin over-anticoagulation?', 'Vitamin K'),
  essay('Compare the mechanisms of action of beta blockers and calcium channel blockers in angina.', 'Beta blockers lower heart rate and contractility; CCBs relax vascular smooth muscle (and some slow the heart). Both cut oxygen demand.', 8, 8),
  essay('A patient on warfarin is prescribed an antibiotic. What should the nurse monitor, and why?', 'INR may rise (interaction / gut flora); watch for bleeding; report bruising, blood in stool.', 6, 6),
];

/** A generated mix, so the 500-question topic is not 500 copies of one row. */
function buildStressDrafts(): Draft[] {
  const drafts: Draft[] = [];
  const subjects = ['percentages', 'ratios', 'series', 'fractions', 'speed and distance', 'averages', 'grammar', 'vocabulary'];
  for (let n = 1; n <= 500; n += 1) {
    const subject = subjects[n % subjects.length];
    const prompt = `Practice question ${n} on ${subject}. Read the item carefully before you answer; this one is long enough to wrap onto a second line in the list.`;
    const slot = n % 10;
    if (slot < 6) drafts.push(multiple(prompt, [`Option A for ${n}`, `Option B for ${n}`, `Option C for ${n}`, `Option D for ${n}`], n % 4));
    else if (slot < 8) drafts.push(trueFalse(prompt, n % 2 === 0));
    else if (slot === 8) drafts.push(identification(prompt, `Answer ${n}`));
    else drafts.push(essay(prompt, n % 20 === 0 ? null : `A good answer to ${n} names the idea and gives one example.`, 4, 5));
  }
  return drafts;
}

const TOPIC_SPECS = [
  { id: 'dev-seed-civil-service', title: 'Civil Service — Numerical', subjectLabel: 'Mathematics', generalDirections: 'Read each item carefully. Use the answer sheet provided.', drafts: CIVIL_SERVICE },
  { id: 'dev-seed-let-english', title: 'LET Gen Ed — English', subjectLabel: 'English', generalDirections: '', drafts: LET_ENGLISH },
  { id: 'dev-seed-pharmacology', title: 'Pharmacology', subjectLabel: 'Health sciences', generalDirections: 'Choose the best answer.', drafts: PHARMACOLOGY },
  { id: 'dev-seed-stress-500', title: 'Stress test — 500 questions', subjectLabel: 'For checking scrolling', generalDirections: '', drafts: buildStressDrafts() },
];

export const DUMMY_TOPIC_IDS: readonly string[] = TOPIC_SPECS.map((spec) => spec.id);

export function buildDummyTopics(): DummyTopic[] {
  return TOPIC_SPECS.map(({ drafts, ...topic }) => ({ ...topic, questions: buildQuestions(topic.id, drafts) }));
}
