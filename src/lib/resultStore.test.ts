import { beforeEach, describe, expect, it, vi } from 'vitest';
import { serverTimestamp } from 'firebase/firestore';
import { listCachedResults, saveCachedResult, stripUndefined } from './resultStore';
import type { TestRunResult } from '../types/domain';

const result = (id: string): TestRunResult => ({
  id,
  testId: 'stress-check-v1',
  instrumentId: 'stress-check-v1',
  instrumentVersion: 'local',
  algorithmVersion: '1',
  contentVersion: '1',
  answers: { q1: 'never' },
  responses: { q1: 'never' },
  totalScore: 0,
  scaleTotals: { total: 0 },
  completedAt: '2026-08-01T00:00:00.000Z',
});

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

describe('result storage', () => {
  it('isolates local cache by signed-in user instead of leaking results across accounts', () => {
    saveCachedResult(result('a'), 'patient-a');
    saveCachedResult(result('b'));

    expect(listCachedResults('patient-a').map((item) => item.id)).toEqual(['a']);
    expect(listCachedResults('patient-b')).toEqual([]);
    expect(listCachedResults().map((item) => item.id)).toEqual(['b']);
  });

  it('removes undefined values before a Firestore create payload is constructed', () => {
    expect(stripUndefined({ keep: 1, remove: undefined, nested: { keep: true, remove: undefined }, list: [1, undefined] })).toEqual({ keep: 1, nested: { keep: true }, list: [1] });
  });

  it('preserves the server timestamp sentinel required by immutable-result rules', () => {
    const createdAt = serverTimestamp();
    expect((stripUndefined({ createdAt }) as { createdAt: unknown }).createdAt).toBe(createdAt);
  });
});
