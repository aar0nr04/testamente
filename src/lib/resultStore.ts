import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { requireFirestore } from './firebase';
import type { TestRunResult } from '../types/domain';

const CACHE_KEY = 'testamente:results-cache';
type StorageScope = string | undefined;

export type ResultSaveOutcome = {
  persistence: 'account' | 'temporary';
  message?: string;
};

function cacheKey(uid?: StorageScope): string {
  return `${CACHE_KEY}:${uid ?? 'anonymous'}`;
}

function readCache(uid?: StorageScope): TestRunResult[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cacheKey(uid)) ?? '[]');
    return Array.isArray(value) ? value as TestRunResult[] : [];
  } catch {
    return [];
  }
}

function sortResults(results: TestRunResult[]): TestRunResult[] {
  return [...results].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function saveCachedResult(result: TestRunResult, uid?: StorageScope): void {
  const results = [result, ...readCache(uid).filter((item) => item.id !== result.id)].slice(0, 50);
  localStorage.setItem(cacheKey(uid), JSON.stringify(results));
}

export function listCachedResults(uid?: StorageScope): TestRunResult[] {
  return sortResults(readCache(uid));
}

/** Removes undefined recursively so a Firestore write cannot fail after scoring is complete. */
export function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((child) => child !== undefined).map(stripUndefined);
  // Preserve Firestore sentinels (for example serverTimestamp), Dates and other non-plain values.
  if (value && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => child === undefined ? [] : [[key, stripUndefined(child)]]));
  }
  return value;
}

export async function saveResult(result: TestRunResult, uid?: string): Promise<ResultSaveOutcome> {
  saveCachedResult(result, uid);
  if (!uid) return { persistence: 'temporary', message: 'Resultado guardado sólo en este dispositivo.' };

  try {
    const reference = doc(requireFirestore(), 'users', uid, 'testResults', result.id);
    // Rules intentionally make test results immutable. Do not use merge: a retry must never become an update.
    if (!(await getDoc(reference)).exists()) {
      await setDoc(reference, stripUndefined({ ...result, userId: uid, createdAt: serverTimestamp() }));
    }
    return { persistence: 'account' };
  } catch {
    try {
      const reference = doc(requireFirestore(), 'users', uid, 'testResults', result.id);
      if ((await getDoc(reference)).exists()) return { persistence: 'account' };
    } catch {
      // The local, account-scoped cache remains the safe fallback.
    }
    return { persistence: 'temporary', message: 'No se pudo sincronizar ahora; el resultado quedó guardado sólo en este dispositivo.' };
  }
}

export async function listResults(uid?: string): Promise<TestRunResult[]> {
  const cached = listCachedResults(uid);
  if (!uid) return cached;

  const database = requireFirestore();
  const snapshot = await getDocs(query(collection(database, 'users', uid, 'testResults'), orderBy('completedAt', 'desc'))).catch(() => null);
  const remote = snapshot?.docs.map((item) => item.data() as TestRunResult) ?? [];
  if (remote.length) {
    const merged = new Map<string, TestRunResult>(cached.map((item) => [item.id, item]));
    for (const result of remote) merged.set(result.id, result);
    return sortResults([...merged.values()]);
  }

  const legacy = await getDocs(collection(database, 'users', uid, 'test_results')).catch(() => null);
  return legacy?.docs.length ? sortResults(legacy.docs.map((item) => item.data() as TestRunResult)) : cached;
}

export async function findResultById(resultId: string, uid?: string): Promise<TestRunResult | undefined> {
  const cached = listCachedResults(uid).find((item) => item.id === resultId);
  if (cached) return cached;
  if (!uid) return undefined;
  const snapshot = await getDoc(doc(requireFirestore(), 'users', uid, 'testResults', resultId)).catch(() => null);
  return snapshot?.exists() ? snapshot.data() as TestRunResult : undefined;
}
