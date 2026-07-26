import { httpsCallable } from 'firebase/functions';
import { requireFunctions } from './firebase';

export type AdminDecision = 'approved' | 'rejected' | 'changes_requested';
export interface AdminDashboard {
  summary: { users: number; pendingPsychologists: number; reviewers: number; instrumentsWithPrivateAccess: number; clinicalReviews: number; licenses: number };
  users: Array<{ uid: string; name: string; email: string; role: 'patient' | 'psychologist'; createdAt?: string; professional?: { headline: string; approvalStatus: string; isVerified: boolean; specialties: string[]; languages: string[] } }>;
  psychologistsPending: Array<{ uid: string; name: string; email: string; role: 'psychologist'; professional?: { approvalStatus: string; isVerified: boolean; specialties: string[] } }>;
  reviewers: Array<{ uid: string; email: string; displayName: string; emailVerified: boolean; claims: { owner: boolean; admin: boolean; professional_reviewer: boolean } }>;
  clinicalReviews: Array<Record<string, unknown>>;
  licenses: Array<Record<string, unknown>>;
  privateAccesses: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
}

export async function loadAdminDashboard(): Promise<AdminDashboard> {
  const callable = httpsCallable<undefined, AdminDashboard>(requireFunctions(), 'getAdminDashboard');
  return (await callable()).data;
}

export async function reviewPsychologistApplication(uid: string, decision: AdminDecision, note?: string): Promise<void> {
  const callable = httpsCallable<{ uid: string; decision: AdminDecision; note?: string }, { uid: string; decision: AdminDecision }>(requireFunctions(), 'reviewPsychologistApplication');
  await callable({ uid, decision, note });
}
