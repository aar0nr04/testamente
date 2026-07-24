import type { InstrumentAlgorithm } from './types';

const likertOptions = [0, 1, 2, 3].map((value) => ({ id: `${value}`, value }));
const simpleItems = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => ({ id: `${prefix}${index + 1}`, kind: 'likert' as const, options: likertOptions, min: 0, max: 3, scaleWeights: { total: 1 } }));

export const gad7Algorithm: InstrumentAlgorithm = {
  instrumentId: 'gad-7', algorithmVersion: '2026.07.1',
  items: simpleItems('gad', 7), scales: [{ id: 'total', label: 'Total' }],
  total: { kind: 'sum', scaleIds: ['total'], ranges: [
    { id: 'minimal', min: 0, max: 4, label: 'Minimal', color: 'green', advice: 'Continue monitoring and discuss concerns with a qualified professional.' },
    { id: 'mild', min: 5, max: 9, label: 'Mild', color: 'yellow', advice: 'Consider discussing persistent symptoms with a qualified professional.' },
    { id: 'moderate', min: 10, max: 14, label: 'Moderate', color: 'orange', advice: 'A professional assessment is recommended.' },
    { id: 'severe', min: 15, max: 21, label: 'Severe', color: 'red', advice: 'Seek timely professional support.' },
  ] },
};

export const phq9Algorithm: InstrumentAlgorithm = {
  instrumentId: 'phq-9', algorithmVersion: '2026.07.1',
  items: simpleItems('phq', 9), scales: [{ id: 'total', label: 'Total' }],
  total: { kind: 'sum', scaleIds: ['total'], ranges: [
    { id: 'minimal', min: 0, max: 4, label: 'Minimal', color: 'green', advice: 'Continue monitoring and discuss concerns with a qualified professional.' },
    { id: 'mild', min: 5, max: 9, label: 'Mild', color: 'yellow', advice: 'Consider discussing persistent symptoms with a qualified professional.' },
    { id: 'moderate', min: 10, max: 14, label: 'Moderate', color: 'orange', advice: 'A professional assessment is recommended.' },
    { id: 'moderately_severe', min: 15, max: 19, label: 'Moderately severe', color: 'orange', advice: 'A professional assessment is recommended promptly.' },
    { id: 'severe', min: 20, max: 27, label: 'Severe', color: 'red', advice: 'Seek timely professional support.' },
  ] },
  alerts: [{ itemId: 'phq9', minimumValue: 1, code: 'self_harm_follow_up', message: 'A positive response to item 9 requires immediate professional follow-up; this app must show local emergency resources.' }],
};

export const instrumentAlgorithms = { 'gad-7': gad7Algorithm, 'phq-9': phq9Algorithm } as const;
