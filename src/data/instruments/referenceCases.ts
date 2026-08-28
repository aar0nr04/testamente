import { scoreInstrument } from '../../engine/instrumentEngine';
import type { AnswerValue, InstrumentAlgorithm, InstrumentScore } from './types';

export interface InstrumentReferenceCase {
  id: string;
  name: string;
  description: string;
  /** These fixtures are technical test data, never patient records or clinical approval. */
  fictional: true;
  responses: Record<string, AnswerValue>;
  expected: {
    total: number;
    scaleTotals: Record<string, number>;
    interpretationId?: string;
    alerts: string[];
  };
}

export interface ReferenceVerification {
  referenceCase: InstrumentReferenceCase;
  score: InstrumentScore;
  passed: boolean;
  differences: string[];
}

const gadAll = (value: string) => Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`gad${index + 1}`, value]));
const phqAll = (value: string) => Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`phq${index + 1}`, value]));

export const instrumentReferenceCases: Record<string, InstrumentReferenceCase[]> = {
  'gad-7': [
    { id: 'gad7-minimum', name: 'Mínimo', description: 'Fixture ficticio: todos los reactivos en 0.', fictional: true, responses: gadAll('0'), expected: { total: 0, scaleTotals: { total: 0 }, interpretationId: 'minimal', alerts: [] } },
    { id: 'gad7-mild-boundary', name: 'Límite leve', description: 'Fixture ficticio: total exactamente 5.', fictional: true, responses: { gad1: '1', gad2: '1', gad3: '1', gad4: '1', gad5: '1', gad6: '0', gad7: '0' }, expected: { total: 5, scaleTotals: { total: 5 }, interpretationId: 'mild', alerts: [] } },
    { id: 'gad7-maximum', name: 'Máximo', description: 'Fixture ficticio: todos los reactivos en 3.', fictional: true, responses: gadAll('3'), expected: { total: 21, scaleTotals: { total: 21 }, interpretationId: 'severe', alerts: [] } },
  ],
  'phq-9': [
    { id: 'phq9-minimum', name: 'Mínimo', description: 'Fixture ficticio: todos los reactivos en 0.', fictional: true, responses: phqAll('0'), expected: { total: 0, scaleTotals: { total: 0 }, interpretationId: 'minimal', alerts: [] } },
    { id: 'phq9-item-nine-follow-up', name: 'Alerta de ítem 9', description: 'Fixture ficticio: sólo ítem 9 en 1; comprueba puntuación y alerta.', fictional: true, responses: { ...phqAll('0'), phq9: '1' }, expected: { total: 1, scaleTotals: { total: 1 }, interpretationId: 'minimal', alerts: ['self_harm_follow_up'] } },
    { id: 'phq9-maximum', name: 'Máximo', description: 'Fixture ficticio: todos los reactivos en 3.', fictional: true, responses: phqAll('3'), expected: { total: 27, scaleTotals: { total: 27 }, interpretationId: 'severe', alerts: ['self_harm_follow_up'] } },
  ],
  rses: [
    { id: 'rses-positive-pattern', name: 'Patrón positivo', description: 'Fixture ficticio: acuerdo fuerte con reactivos positivos y desacuerdo fuerte con los inversos.', fictional: true, responses: { rses1: 'strongly_agree', rses2: 'strongly_agree', rses3: 'strongly_disagree', rses4: 'strongly_agree', rses5: 'strongly_disagree', rses6: 'strongly_agree', rses7: 'strongly_agree', rses8: 'strongly_disagree', rses9: 'strongly_disagree', rses10: 'strongly_disagree' }, expected: { total: 30, scaleTotals: { total: 30 }, alerts: [] } },
    { id: 'rses-agree-pattern', name: 'Patrón de acuerdo', description: 'Fixture ficticio: acuerdo en todos los reactivos; comprueba las cinco inversiones.', fictional: true, responses: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`rses${index + 1}`, 'agree'])), expected: { total: 15, scaleTotals: { total: 15 }, alerts: [] } },
  ],
};

export function runInstrumentReferenceCases(algorithm: InstrumentAlgorithm): ReferenceVerification[] {
  return (instrumentReferenceCases[algorithm.instrumentId] ?? []).map((referenceCase) => {
    const score = scoreInstrument(algorithm, referenceCase.responses);
    const differences: string[] = [];
    if (score.total !== referenceCase.expected.total) differences.push(`total ${score.total} ≠ ${referenceCase.expected.total}`);
    for (const [scale, expected] of Object.entries(referenceCase.expected.scaleTotals)) if (score.scaleTotals[scale] !== expected) differences.push(`${scale} ${score.scaleTotals[scale] ?? 0} ≠ ${expected}`);
    if ((score.interpretation?.id ?? undefined) !== referenceCase.expected.interpretationId) differences.push(`interpretación ${score.interpretation?.id ?? 'ninguna'} ≠ ${referenceCase.expected.interpretationId ?? 'ninguna'}`);
    const alerts = score.alerts.map((alert) => alert.code).sort();
    if (alerts.join('|') !== [...referenceCase.expected.alerts].sort().join('|')) differences.push('alertas no coinciden');
    if (score.validationErrors.length) differences.push(...score.validationErrors);
    return { referenceCase, score, passed: differences.length === 0, differences };
  });
}
