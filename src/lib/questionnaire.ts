import { scoreInstrument } from '../engine/instrumentEngine';
import type { InstrumentScore } from '../data/instruments/types';
import type { CatalogEntry } from '../data/tests';
import type { TestRunResult } from '../types/domain';

export function scoreCatalogTest(test: CatalogEntry, answers: Record<string, string>): InstrumentScore {
  if (!test.algorithm) throw new Error('This instrument does not have a technically validated scoring algorithm.');
  return scoreInstrument(test.algorithm, answers);
}

export function firstInvalidQuestionIndex(test: CatalogEntry, score: InstrumentScore): number | undefined {
  const firstError = score.validationErrors[0];
  if (!firstError) return undefined;
  const questionId = firstError.split(':', 1)[0];
  const index = test.questions.findIndex((question) => question.id === questionId);
  return index < 0 ? undefined : index;
}

export function createQuestionnaireResult(test: CatalogEntry, score: InstrumentScore, answers: Record<string, string>, runId: string, userId?: string): TestRunResult {
  if (score.validationErrors.length) throw new Error('Cannot save an incomplete questionnaire.');
  return {
    id: runId,
    testId: test.id,
    instrumentId: test.id,
    instrumentVersion: test.version ?? 'local',
    algorithmVersion: score.algorithmVersion,
    contentVersion: test.contentVersion ?? 'local',
    ...(test.slug ? { slug: test.slug } : {}),
    ...(test.version ? { version: test.version } : {}),
    ...(test.locale ? { locale: test.locale } : {}),
    title: test.title,
    answers: { ...answers },
    responses: { ...answers },
    totalScore: score.total,
    ...(score.interpretation ? { bandId: score.interpretation.id, interpretation: score.interpretation.label, advice: score.interpretation.advice } : {}),
    scaleTotals: { ...score.scaleTotals },
    completedAt: new Date().toISOString(),
    ...(userId ? { userId } : {}),
  };
}
