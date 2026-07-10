import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { createRegistrationProfile, getOrCreateProfile } from '../repositories/profileRepository';
import type { UserProfile, UserRole } from '../types/domain';

interface AuthContextValue { user: User | null; profile: UserProfile | null; loading: boolean; error: string | null; login: (email: string, password: string) => Promise<void>; register: (data: RegistrationData) => Promise<void>; loginWithGoogle: () => Promise<void>; logout: () => Promise<void>; resendVerification: () => Promise<void>; refreshVerification: () => Promise<boolean>; resetPassword: (email: string) => Promise<void>; }
export interface RegistrationData { email: string; password: string; name: string; role: Extract<UserRole, 'patient' | 'psychologist'>; termsAccepted: boolean; termsVersion: string; phone?: string; licenseNumber?: string; specialty?: string; description?: string; }
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readableError(error: unknown): string { return error instanceof Error ? error.message : 'Ocurrió un error de autenticación.'; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [profile, setProfile] = useState<UserProfile | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, async (next) => { setUser(next); if (next) { try { setProfile(await getOrCreateProfile(next.uid, next.email ?? undefined, next.displayName ?? undefined)); } catch (err) { setError(readableError(err)); } } else setProfile(null); setLoading(false); }), []);
  const value = useMemo<AuthContextValue>(() => ({
    user, profile, loading, error,
    async login(email, password) { setError(null); const result = await signInWithEmailAndPassword(auth, email, password); await reload(result.user); if (!result.user.emailVerified) { await sendEmailVerification(result.user); await signOut(auth); throw new Error('Verifica tu correo para continuar. Te enviamos un nuevo enlace.'); } },
    async register(data) { setError(null); if (!data.termsAccepted) throw new Error('Debes aceptar los términos y condiciones.'); const result = await createUserWithEmailAndPassword(auth, data.email, data.password); const profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'> = { role: data.role, name: data.name, email: data.email, phone: data.phone, lang: 'es', termsAccepted: true, termsVersion: data.termsVersion, consents: { analyticsAnon: false, reminders: true, email: true, push: false }, patientPrefs: { modalities: [], motives: [], hours: [] }, professional: data.role === 'psychologist' ? { specialties: data.specialty ? [data.specialty] : [], languages: ['es'], modalities: ['online'], isPublicPhone: false, isPublicLocation: false, availability: {}, isVerified: false, acceptingNewPatients: true, licenseNumber: data.licenseNumber, headline: data.description, approvalStatus: 'pending' } : undefined }; await createRegistrationProfile(result.user.uid, profileData); await sendEmailVerification(result.user); setUser(result.user); setProfile({ uid: result.user.uid, ...profileData }); },
    async loginWithGoogle() { setError(null); try { const result = await signInWithPopup(auth, googleProvider); await getOrCreateProfile(result.user.uid, result.user.email ?? undefined, result.user.displayName ?? undefined); } catch (err) { if (err instanceof Error && err.message.includes('popup')) { await signInWithRedirect(auth, googleProvider); return; } throw err; } },
    async logout() { await signOut(auth); },
    async resendVerification() { if (!auth.currentUser) throw new Error('No hay una sesión activa.'); await sendEmailVerification(auth.currentUser); },
    async refreshVerification() { if (!auth.currentUser) return false; await reload(auth.currentUser); setUser({ ...auth.currentUser }); return Boolean(auth.currentUser.emailVerified); },
    async resetPassword(email) { await sendPasswordResetEmail(auth, email); },
  }), [error, loading, profile, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.'); return value; }
