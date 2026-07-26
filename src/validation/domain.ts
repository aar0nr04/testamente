import type { PsychologicalTest, UserProfile } from '../types/domain';

export function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
export function validateProfile(value: unknown): value is UserProfile {
  if (!isRecord(value) || typeof value.uid !== 'string' || typeof value.name !== 'string') return false;
  return ['patient', 'psychologist'].includes(String(value.role)) && typeof value.termsAccepted === 'boolean';
}
export function validateTest(test: PsychologicalTest): string[] {
  const errors: string[] = [];
  if (!test.id || !Array.isArray(test.questions)) errors.push('id/questions');
  const scaleIds = new Set((test.scales ?? []).map((scale) => scale.id));
  test.questions.forEach((question) => {
    if (!question.id || !Array.isArray(question.options)) errors.push(`question:${question.id}`);
    question.options.forEach((option) => { if (!option.id) errors.push(`option:${question.id}`); });
    Object.entries(question.scoresMatrix ?? {}).forEach(([scale, weights]) => { if (!scaleIds.has(scale) || weights.length < question.options.length) errors.push(`matrix:${question.id}:${scale}`); });
  });
  (test.results?.scales ?? []).forEach((scale) => { if (!scaleIds.has(scale.id)) errors.push(`result-scale:${scale.id}`); scale.ranges.forEach((range) => { if (range.min > range.max) errors.push(`range:${scale.id}`); }); });
  return errors;
}
