import { describe, expect, it } from 'vitest';
import { gad7Algorithm, phq9Algorithm, rsesAlgorithm } from './algorithms';
import { runInstrumentReferenceCases } from './referenceCases';
import { scoreInstrument } from '../../engine/instrumentEngine';

describe('independent technical reference cases', () => {
  it.each([gad7Algorithm, phq9Algorithm, rsesAlgorithm])('matches every declared reference case for $instrumentId', (algorithm) => {
    const results = runInstrumentReferenceCases(algorithm);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it('records the original value, reverse operation and scale contribution for RSES', () => {
    const result = scoreInstrument(rsesAlgorithm, { rses1: 'strongly_agree', rses2: 'strongly_agree', rses3: 'strongly_disagree', rses4: 'strongly_agree', rses5: 'strongly_disagree', rses6: 'strongly_agree', rses7: 'strongly_agree', rses8: 'strongly_disagree', rses9: 'strongly_disagree', rses10: 'strongly_disagree' });

    expect(result.total).toBe(30);
    expect(result.calculation.find((item) => item.itemId === 'rses3')).toMatchObject({ rawValue: 0, scoredValue: 3, reverseApplied: true, contributions: { total: 3 } });
  });
});
