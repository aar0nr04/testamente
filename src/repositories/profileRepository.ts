import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { requireFirestore } from '../lib/firebase';
import { validateProfile } from '../validation/domain';
import type { LocaleCode, ProfessionalProfile, UserProfile, UserRole } from '../types/domain';

const defaults = (uid: string, role: UserRole, name: string, email?: string): UserProfile => ({
  uid, role, name, email, lang: 'es', termsAccepted: false,
  consents: { analyticsAnon: false, reminders: true, email: true, push: false },
  patientPrefs: { modalities: [], motives: [], hours: [] },
});

export type EditableProfessionalProfile = Pick<ProfessionalProfile,
  'headline' | 'description' | 'specialties' | 'languages' | 'modalities' | 'priceMXN' | 'sessionMinutes'
  | 'isPublicPhone' | 'isPublicLocation' | 'availability' | 'acceptingNewPatients' | 'licenseNumber'>;

export type EditableProfile = Pick<UserProfile, 'name' | 'photoUrl' | 'phone' | 'lang' | 'country' | 'state' | 'city' | 'timeZone' | 'consents' | 'patientPrefs'> & {
  professional?: EditableProfessionalProfile;
};

export function editableProfessional(input: Partial<ProfessionalProfile> | undefined): EditableProfessionalProfile | undefined {
  if (!input) return undefined;
  return {
    headline: input.headline?.trim() || undefined,
    description: input.description?.trim() || undefined,
    specialties: Array.isArray(input.specialties) ? input.specialties.map((value) => value.trim()).filter(Boolean).slice(0, 12) : [],
    languages: Array.isArray(input.languages) ? input.languages.filter((value): value is LocaleCode => ['es', 'en', 'fr', 'pt', 'it', 'de', 'zh'].includes(value)).slice(0, 7) : ['es'],
    modalities: Array.isArray(input.modalities) ? input.modalities.map((value) => value.trim()).filter(Boolean).slice(0, 6) : [],
    priceMXN: typeof input.priceMXN === 'number' && input.priceMXN >= 0 ? input.priceMXN : undefined,
    sessionMinutes: typeof input.sessionMinutes === 'number' && input.sessionMinutes > 0 && input.sessionMinutes <= 240 ? input.sessionMinutes : undefined,
    isPublicPhone: input.isPublicPhone === true,
    isPublicLocation: input.isPublicLocation === true,
    availability: Object.fromEntries(Object.entries(input.availability ?? {}).map(([day, slots]) => [day, Array.isArray(slots) ? slots.map(String).slice(0, 12) : []])),
    acceptingNewPatients: input.acceptingNewPatients === true,
    licenseNumber: input.licenseNumber?.trim() || undefined,
  };
}

export async function getOrCreateProfile(uid: string, email?: string, displayName?: string): Promise<UserProfile> {
  const database = requireFirestore();
  const reference = doc(database, 'users', uid);
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

/** Only explicitly editable profile fields are sent from the browser. */
export async function updateProfile(uid: string, changes: Partial<EditableProfile>): Promise<void> {
  const safe: Record<string, unknown> = {
    name: typeof changes.name === 'string' ? changes.name.trim() : undefined,
    photoUrl: typeof changes.photoUrl === 'string' ? changes.photoUrl : undefined,
    phone: typeof changes.phone === 'string' ? changes.phone.trim() : undefined,
    lang: changes.lang,
    country: typeof changes.country === 'string' ? changes.country.trim() : undefined,
    state: typeof changes.state === 'string' ? changes.state.trim() : undefined,
    city: typeof changes.city === 'string' ? changes.city.trim() : undefined,
    timeZone: typeof changes.timeZone === 'string' ? changes.timeZone.trim() : undefined,
    consents: changes.consents,
    patientPrefs: changes.patientPrefs,
    updatedAt: serverTimestamp(),
  };
  if (changes.professional) {
    const professional = editableProfessional(changes.professional);
    if (professional) Object.entries(professional).forEach(([key, value]) => { safe[`professional.${key}`] = value === undefined ? deleteField() : value; });
  }
  Object.keys(safe).forEach((key) => { if (safe[key] === undefined) delete safe[key]; });
  await updateDoc(doc(requireFirestore(), 'users', uid), safe);
}
