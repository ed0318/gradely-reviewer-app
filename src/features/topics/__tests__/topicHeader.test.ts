import { describe, expect, it } from 'vitest';
import { buildDeleteTopicWarning } from '../deleteTopicWarning';
import { findTopicHeaderProblem, toTopicHeader } from '../topicHeader';

describe('topic header', () => {
  it('needs a title', () => {
    expect(findTopicHeaderProblem({ title: '  ', subject: 'x', directions: '' })).toBe('Give the topic a title.');
    expect(findTopicHeaderProblem({ title: 'Pharmacology', subject: '', directions: '' })).toBeNull();
  });

  it('stores it trimmed, with an empty subject as null', () => {
    expect(toTopicHeader({ title: '  Pharmacology ', subject: '  ', directions: ' Choose the best answer. ' })).toEqual({
      title: 'Pharmacology',
      subjectLabel: null,
      generalDirections: 'Choose the best answer.',
    });
  });
});

describe('delete topic warning', () => {
  it('says what goes and what stays', () => {
    const warning = buildDeleteTopicWarning(84, 4);
    expect(warning.cascadeItems[0].label).toBe('All 84 questions');
    expect(warning.keepItems[0].label).toBe('The 4 exams you made from it');
    expect(warning.keepItems[0].detail).toContain('own copy');
  });

  it('reads right for one question, one exam and none', () => {
    expect(buildDeleteTopicWarning(1, 1).cascadeItems[0].label).toBe('The question in it');
    expect(buildDeleteTopicWarning(1, 1).keepItems[0].label).toBe('The exam you made from it');
    expect(buildDeleteTopicWarning(0, 0).keepItems[0].label).toBe('Exams you make from it');
  });
});
