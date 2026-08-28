import { describe, expect, it } from 'vitest';
import { getReviewTestById, getTestById } from '../data/tests';
import { createQuestionnaireResult, firstInvalidQuestionIndex, scoreCatalogTest } from './questionnaire';

describe('questionnaire runner mapping', () => {
  it('scores every GAD-7 answer through the instrument engine and stores versioned result metadata', () => {
    const test = getReviewTestById('gad-7', 'es');
    expect(test).toBeDefined();
    const answers = Object.fromEntries(test!.questions.map((question) => [question.id, '3']));
    const score = scoreCatalogTest(test!, answers);
    const result = createQuestionnaireResult(test!, score, answers, 'run-1', 'patient-1');

    expect(score.total).toBe(21);
    expect(score.validationErrors).toEqual([]);
    expect(result).toMatchObject({ id: 'run-1', instrumentId: 'gad-7', totalScore: 21, algorithmVersion: '2026.07.1', contentVersion: '2026.07.1', userId: 'patient-1' });
  });

  it('keeps an option with score zero valid and points the runner to the missing question', () => {
    const test = getTestById('stress-check-v1', 'es')!;
    const partial = { q1: 'never', q2: 'never' };
    const partialScore = scoreCatalogTest(test, partial);
    const complete = { q1: 'never', q2: 'never', q3: 'never', q4: 'never' };

    expect(firstInvalidQuestionIndex(test, partialScore)).toBe(2);
    expect(scoreCatalogTest(test, complete).total).toBe(0);
  });

  it('retains the PHQ-9 positive item-nine safety alert while answers are being completed', () => {
    const test = getReviewTestById('phq-9', 'es')!;
    const score = scoreCatalogTest(test, { phq9: '1' });

    expect(score.alerts).toContainEqual(expect.objectContaining({ code: 'self_harm_follow_up' }));
  });
});
