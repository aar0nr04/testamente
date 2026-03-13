import type { TestRunResult } from '../types/test';

const RESULTS_KEY = 'testamente:results';

export function saveResult(result: TestRunResult) {
  const existing = listResults();
  const updated = [result, ...existing].slice(0, 50);

  localStorage.setItem(RESULTS_KEY, JSON.stringify(updated));
  sessionStorage.setItem(`testamente:result:${result.id}`, JSON.stringify(result));
}

export function listResults(): TestRunResult[] {
  const raw = localStorage.getItem(RESULTS_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as TestRunResult[];
  return parsed.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function findResultById(resultId: string): TestRunResult | undefined {
  const fromSession = sessionStorage.getItem(`testamente:result:${resultId}`);

  if (fromSession) {
    return JSON.parse(fromSession) as TestRunResult;
  }

  return listResults().find((result) => result.id === resultId);
}
