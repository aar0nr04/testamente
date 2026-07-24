import { doc, getDoc, getDocs, collection, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { requireFirestore } from './firebase';
import type { TestRunResult } from '../types/domain';

const CACHE_KEY = 'testamente:results-cache';
function readCache(): TestRunResult[] { try { const value: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'); return Array.isArray(value) ? value as TestRunResult[] : []; } catch { return []; } }
export function saveCachedResult(result: TestRunResult): void { localStorage.setItem(CACHE_KEY, JSON.stringify([result, ...readCache().filter((item) => item.id !== result.id)].slice(0, 50))); }
export function listCachedResults(): TestRunResult[] { return readCache().sort((a, b) => b.completedAt.localeCompare(a.completedAt)); }
export async function saveResult(result: TestRunResult, uid?: string): Promise<void> { saveCachedResult(result); if (!uid) return; await setDoc(doc(requireFirestore(), 'users', uid, 'testResults', result.id), { ...result, userId: uid, createdAt: serverTimestamp() }, { merge: true }); }
export async function listResults(uid?: string): Promise<TestRunResult[]> { if (!uid) return listCachedResults(); const database = requireFirestore(); const snapshot = await getDocs(query(collection(database, 'users', uid, 'testResults'), orderBy('completedAt', 'desc'))).catch(() => null); if (snapshot && !snapshot.empty) return snapshot.docs.map((item) => item.data() as TestRunResult); const legacy = await getDocs(collection(database, 'users', uid, 'test_results')).catch(() => null); return legacy?.docs.map((item) => item.data() as TestRunResult) ?? []; }
export async function findResultById(resultId: string, uid?: string): Promise<TestRunResult | undefined> { const cached = listCachedResults().find((item) => item.id === resultId); if (cached) return cached; if (!uid) return undefined; const snapshot = await getDoc(doc(requireFirestore(), 'users', uid, 'testResults', resultId)); return snapshot.exists() ? snapshot.data() as TestRunResult : undefined; }
