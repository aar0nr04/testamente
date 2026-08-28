import type { AnswerValue, InstrumentAlgorithm, InstrumentAlgorithmItem, InstrumentCalculationItem, InstrumentScore, ScoreRange } from '../data/instruments/types';

function rangeFor(value: number, ranges: ScoreRange[]): ScoreRange | undefined {
  return ranges.find((range) => value >= range.min && value <= range.max);
}

function optionValue(item: InstrumentAlgorithmItem, answer: Exclude<AnswerValue, undefined>): number | undefined {
  if (typeof answer === 'number') return answer;
  if (Array.isArray(answer)) return answer.reduce<number>((total, value) => total + (item.options?.find((option) => option.id === value)?.value ?? 0), 0);
  return item.options?.find((option) => option.id === answer)?.value;
}

function validate(item: InstrumentAlgorithmItem, answer: AnswerValue): string | undefined {
  if (answer === undefined || answer === '') return item.required === false ? undefined : `${item.id}:required`;
  if (item.kind === 'multiple' && !Array.isArray(answer)) return `${item.id}:multiple_expected`;
  if (item.kind !== 'multiple' && Array.isArray(answer)) return `${item.id}:single_expected`;
  if ((item.kind === 'numeric' || item.kind === 'timed') && typeof answer !== 'number') return `${item.id}:number_expected`;
  if (typeof answer === 'number' && ((item.min !== undefined && answer < item.min) || (item.max !== undefined && answer > item.max))) return `${item.id}:out_of_range`;
  if (typeof answer === 'string' && item.options && !item.options.some((option) => option.id === answer)) return `${item.id}:invalid_option`;
  if (Array.isArray(answer) && item.options && answer.some((value) => !item.options?.some((option) => option.id === value))) return `${item.id}:invalid_option`;
  return undefined;
}

export function scoreInstrument(algorithm: InstrumentAlgorithm, responses: Record<string, AnswerValue>): InstrumentScore {
  const scaleTotals: Record<string, number> = Object.fromEntries(algorithm.scales.map((scale) => [scale.id, 0]));
  const validationErrors: string[] = [];
  const alerts: { code: string; message: string }[] = [];
  const calculation: InstrumentCalculationItem[] = [];

  for (const item of algorithm.items) {
    const answer = responses[item.id];
    const error = validate(item, answer);
    if (error) {
      validationErrors.push(error);
      calculation.push({ itemId: item.id, response: answer, reverseApplied: Boolean(item.reverse), contributions: {} });
      continue;
    }
    if (answer === undefined) {
      calculation.push({ itemId: item.id, response: answer, reverseApplied: Boolean(item.reverse), contributions: {} });
      continue;
    }
    const rawValue = optionValue(item, answer);
    if (rawValue === undefined) {
      validationErrors.push(`${item.id}:unscorable`);
      calculation.push({ itemId: item.id, response: answer, reverseApplied: Boolean(item.reverse), contributions: {} });
      continue;
    }
    const value = item.reverse ? (item.min ?? 0) + (item.max ?? 0) - rawValue : rawValue;
    const contributions: Record<string, number> = {};
    for (const [scaleId, weight] of Object.entries(item.scaleWeights ?? { total: 1 })) {
      const contribution = value * weight;
      scaleTotals[scaleId] = (scaleTotals[scaleId] ?? 0) + contribution;
      contributions[scaleId] = (contributions[scaleId] ?? 0) + contribution;
    }
    if (typeof answer === 'string') for (const [scaleId, matrix] of Object.entries(item.scoreMatrix ?? {})) {
      const contribution = matrix[answer] ?? 0;
      scaleTotals[scaleId] = (scaleTotals[scaleId] ?? 0) + contribution;
      contributions[scaleId] = (contributions[scaleId] ?? 0) + contribution;
    }
    calculation.push({ itemId: item.id, response: answer, rawValue, scoredValue: value, reverseApplied: Boolean(item.reverse), contributions });
    for (const alert of algorithm.alerts?.filter((candidate) => candidate.itemId === item.id && value >= candidate.minimumValue) ?? []) alerts.push({ code: alert.code, message: alert.message });
  }

  const selectedScales = algorithm.total.scaleIds ?? Object.keys(scaleTotals);
  const sum = selectedScales.reduce((total, scaleId) => total + (scaleTotals[scaleId] ?? 0), 0);
  const total = algorithm.total.kind === 'mean' && selectedScales.length ? sum / selectedScales.length : sum;
  return { instrumentId: algorithm.instrumentId, algorithmVersion: algorithm.algorithmVersion, responses, scaleTotals, total, interpretation: rangeFor(total, algorithm.total.ranges), alerts, validationErrors, calculation };
}
