import type { PsychologicalTest, TestRunResult } from '../types/test';

export function calculateResult(test: PsychologicalTest, answers: Record<string, string>): TestRunResult {
  const totalScore = test.questions.reduce((acc, question) => {
    const selectedOptionId = answers[question.id];
    const option = question.options.find((item) => item.id === selectedOptionId);
    return acc + (option?.score ?? 0);
  }, 0);

  const band =
    test.resultBands.find((candidate) => totalScore >= candidate.minInclusive && totalScore <= candidate.maxInclusive) ??
    test.resultBands[test.resultBands.length - 1];

  return {
    id: crypto.randomUUID(),
    testId: test.id,
    totalScore,
    bandId: band.id,
    completedAt: new Date().toISOString(),
  };
}
