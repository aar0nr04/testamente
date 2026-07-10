import type { PsychologicalTest, ResultRange, ScaleResult, TestRunResult } from '../types/domain';

export interface ScoreReport { totalScore: number; scales: ScaleResult[]; primaryRange?: ResultRange }
export function stableQuestionOrder<T extends { id: string }>(questions: T[], seed = ''): T[] { return [...questions].sort((a, b) => `${seed}:${a.id}`.localeCompare(`${seed}:${b.id}`)); }
function rangeFor(score: number, ranges: ResultRange[] | undefined): ResultRange | undefined { return ranges?.find((range) => score >= (range.min ?? range.minInclusive ?? Number.NEGATIVE_INFINITY) && score <= (range.max ?? range.maxInclusive ?? Number.POSITIVE_INFINITY)); }
export function calculateScores(test: PsychologicalTest, answers: Record<string, string>): ScoreReport {
  const totals = new Map<string, number>(); let totalScore = 0;
  for (const question of test.questions) {
    const optionIndex = question.options.findIndex((option) => option.id === answers[question.id]); if (optionIndex < 0) continue;
    const option = question.options[optionIndex];
    const matrices = question.scoresMatrix ?? {};
    if (Object.keys(matrices).length) Object.entries(matrices).forEach(([scale, values]) => totals.set(scale, (totals.get(scale) ?? 0) + (values[optionIndex] ?? 0)));
    else { const scale = question.scores?.[0]?.scale ?? test.scales?.[0]?.id ?? 'total'; const value = option.value ?? option.score ?? optionIndex; totals.set(scale, (totals.get(scale) ?? 0) + value); totalScore += value; }
  }
  if (Object.keys(test.questions[0]?.scoresMatrix ?? {}).length) totalScore = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const scales: ScaleResult[] = (test.scales?.length ? test.scales.map((scale) => ({ scaleId: scale.id, score: totals.get(scale.id) ?? 0, range: rangeFor(totals.get(scale.id) ?? 0, test.results?.scales.find((item) => item.id === scale.id)?.ranges) })) : [{ scaleId: 'total', score: totalScore, range: rangeFor(totalScore, test.resultBands) }]);
  return { totalScore, scales, primaryRange: scales[0]?.range };
}
export function calculateResult(test: PsychologicalTest, answers: Record<string, string>, userId?: string): TestRunResult {
  const report = calculateScores(test, answers); const band = report.primaryRange ?? test.resultBands?.[test.resultBands.length - 1];
  return { id: crypto.randomUUID(), testId: test.id, slug: test.slug, version: test.version, locale: test.locale, title: test.title, answers, totalScore: report.totalScore, bandId: band?.labelKey ?? band?.label, scales: report.scales, completedAt: new Date().toISOString(), userId, advice: band?.advice ?? band?.adviceKey };
}
