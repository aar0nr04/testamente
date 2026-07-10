import { describe, expect, it } from 'vitest';
import { calculateScores } from './testEngine';
import type { PsychologicalTest } from '../types/domain';

describe('calculateScores', () => {
  it('accumulates scoresMatrix across multiple scales', () => {
    const test: PsychologicalTest = {
      id: 'fixture', title: 'Fixture', estimatedMinutes: 1,
      scales: [{ id: 'anxiety', title: 'Ansiedad' }, { id: 'resilience', title: 'Resiliencia' }],
      questions: [{ id: 'q1', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], scoresMatrix: { anxiety: [0, 2], resilience: [2, 0] } }],
      results: { scales: [{ id: 'anxiety', ranges: [{ min: 0, max: 1, label: 'Bajo' }, { min: 2, max: 2, label: 'Alto' }] }, { id: 'resilience', ranges: [{ min: 0, max: 2, label: 'Válido' }] }] },
    };
    const result = calculateScores(test, { q1: 'b' });
    expect(result.totalScore).toBe(2);
    expect(result.scales).toEqual([{ scaleId: 'anxiety', score: 2, range: { min: 2, max: 2, label: 'Alto' } }, { scaleId: 'resilience', score: 0, range: { min: 0, max: 2, label: 'Válido' } }]);
  });
});
