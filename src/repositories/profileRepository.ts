import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { requireFirestore } from '../lib/firebase';
import { validateProfile } from '../validation/domain';
import type { UserProfile, UserRole } from '../types/domain';

const defaults = (uid: string, role: UserRole, name: string, email?: string): UserProfile => ({ uid, role, name, email, lang: 'es', termsAccepted: false, consents: { analyticsAnon: false, reminders: true, email: true, push: false }, patientPrefs: { modalities: [], motives: [], hours: [] } });

export async function getOrCreateProfile(uid: string, email?: string, displayName?: string): Promise<UserProfile> {
  const database = requireFirestore(); const reference = doc(database, 'users', uid);
  const snapshot = await getDoc(reference);
  if (snapshot.exists()) {
    const data = { uid, ...snapshot.data() } as unknown;
    if (validateProfile(data)) return data;
  }
  const profile = defaults(uid, 'patient', displayName ?? '', email);
  await setDoc(reference, { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  return profile;
}

export async function createRegistrationProfile(uid: string, data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
  await setDoc(doc(requireFirestore(), 'users', uid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: false });
}

export async function updateProfile(uid: string, changes: Partial<UserProfile>): Promise<void> {
  const safe = { ...changes, uid: undefined, role: undefined, termsAcceptedAt: undefined, updatedAt: serverTimestamp() };
  await setDoc(doc(requireFirestore(), 'users', uid), safe, { merge: true });
}
