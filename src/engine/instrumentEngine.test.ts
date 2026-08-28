import { describe, expect, it } from 'vitest';
import { gad7Algorithm, phq9Algorithm } from '../data/instruments/algorithms';
import { scoreInstrument } from './instrumentEngine';
import type { InstrumentAlgorithm } from '../data/instruments/types';

describe('scoreInstrument', () => {
  it('matches GAD-7 golden minimum, maximum and a range boundary', () => {
    expect(scoreInstrument(gad7Algorithm, Object.fromEntries(gad7Algorithm.items.map((item) => [item.id, '0']))).total).toBe(0);
    expect(scoreInstrument(gad7Algorithm, Object.fromEntries(gad7Algorithm.items.map((item) => [item.id, '3']))).total).toBe(21);
    const boundary = scoreInstrument(gad7Algorithm, { gad1: '1', gad2: '1', gad3: '1', gad4: '1', gad5: '1', gad6: '0', gad7: '0' });
    expect(boundary.interpretation?.id).toBe('mild');
  });

  it('marks PHQ-9 item 9 follow-up without changing its reproducible score', () => {
    const result = scoreInstrument(phq9Algorithm, Object.fromEntries(phq9Algorithm.items.map((item) => [item.id, item.id === 'phq9' ? '1' : '0'])));
    expect(result).toMatchObject({ total: 1, scaleTotals: { total: 1 }, interpretation: { id: 'minimal' } });
    expect(result.alerts[0]?.code).toBe('self_harm_follow_up');
  });

  it('supports reverse items, multiple selection, score matrices and invalid input', () => {
    const algorithm: InstrumentAlgorithm = {
      instrumentId: 'fixture', algorithmVersion: '1', scales: [{ id: 'total', label: 'Total' }, { id: 'subscale', label: 'Subscale' }],
      items: [
        { id: 'reverse', kind: 'likert', options: [{ id: '1', value: 1 }, { id: '4', value: 4 }], min: 1, max: 4, reverse: true, scaleWeights: { total: 1 } },
        { id: 'multiple', kind: 'multiple', options: [{ id: 'a', value: 1 }, { id: 'b', value: 2 }], scaleWeights: { total: 1 } },
        { id: 'matrix', kind: 'single', options: [{ id: 'yes', value: 0 }, { id: 'no', value: 0 }], scoreMatrix: { subscale: { yes: 2, no: 0 } } },
      ], total: { kind: 'sum', scaleIds: ['total', 'subscale'], ranges: [{ id: 'all', min: 0, max: 99, label: 'All', color: 'gray', advice: '' }] },
    };
    expect(scoreInstrument(algorithm, { reverse: '1', multiple: ['a', 'b'], matrix: 'yes' }).scaleTotals).toEqual({ total: 7, subscale: 2 });
    expect(scoreInstrument(algorithm, { reverse: '1', multiple: ['a', 'b'], matrix: 'yes' }).calculation).toEqual(expect.arrayContaining([expect.objectContaining({ itemId: 'reverse', rawValue: 1, scoredValue: 4, reverseApplied: true, contributions: { total: 4 } })]));
    expect(scoreInstrument(algorithm, { reverse: 'unexpected', multiple: 'a', matrix: 'yes' }).validationErrors).toEqual(expect.arrayContaining(['reverse:invalid_option', 'multiple:multiple_expected']));
  });
});
