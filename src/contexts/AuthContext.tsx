import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createUserWithEmailAndPassword, onIdTokenChanged, reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, type IdTokenResult, type User } from 'firebase/auth';
import { auth, googleProvider, requireAuth } from '../lib/firebase';
import { firebaseConfigurationMessage } from '../lib/env';
import { createRegistrationProfile, getOrCreateProfile } from '../repositories/profileRepository';
import type { UserProfile, UserRole } from '../types/domain';

export interface PermissionClaims {
  isOwner: boolean;
  isAdmin: boolean;
  isProfessionalReviewer: boolean;
}

export const emptyPermissionClaims: PermissionClaims = { isOwner: false, isAdmin: false, isProfessionalReviewer: false };

export function permissionClaimsFromToken(token: Pick<IdTokenResult, 'claims'> | { claims?: Record<string, unknown> } | undefined): PermissionClaims {
  const claims = token?.claims ?? {};
  const active = typeof claims.staff_expires_at !== 'number' || claims.staff_expires_at > Date.now();
  return {
    isOwner: claims.owner === true && active,
    isAdmin: claims.admin === true && active,
    isProfessionalReviewer: claims.professional_reviewer === true && active,
  };
}

interface AuthContextValue extends PermissionClaims {
  hasStaffAccess: boolean;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  refreshClaims: () => Promise<PermissionClaims>;
  resetPassword: (email: string) => Promise<void>;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  termsAccepted: boolean;
  termsVersion: string;
  phone?: string;
  licenseNumber?: string;
  specialty?: string;
  description?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
function readableError(error: unknown): string { return error instanceof Error ? error.message : 'Ocurrió un error de autenticación.'; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claims, setClaims] = useState<PermissionClaims>(emptyPermissionClaims);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setError(firebaseConfigurationMessage ?? 'Firebase no está configurado.');
      setLoading(false);
      return undefined;
    }
    return onIdTokenChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        try {
          const [nextProfile, token] = await Promise.all([
            getOrCreateProfile(next.uid, next.email ?? undefined, next.displayName ?? undefined),
            next.getIdTokenResult(),
          ]);
          setProfile(nextProfile);
          setClaims(permissionClaimsFromToken(token));
        } catch (reason) {
          setError(readableError(reason));
          setClaims(emptyPermissionClaims);
        }
      } else {
        setProfile(null);
        setClaims(emptyPermissionClaims);
      }
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, profile, loading, error, ...claims, hasStaffAccess: claims.isOwner || claims.isAdmin || claims.isProfessionalReviewer,
    async login(email, password) {
      setError(null);
      const configuredAuth = requireAuth();
      const result = await signInWithEmailAndPassword(configuredAuth, email, password);
      await reload(result.user);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(configuredAuth);
        throw new Error('Verifica tu correo para continuar. Te enviamos un nuevo enlace.');
      }
    },
    async register(data) {
      setError(null);
      if (!data.termsAccepted) throw new Error('Debes aceptar los términos y condiciones.');
      const result = await createUserWithEmailAndPassword(requireAuth(), data.email, data.password);
      const profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'> = {
        role: data.role,
        name: data.name,
        email: data.email,
        phone: data.phone,
        lang: 'es',
        termsAccepted: true,
        termsVersion: data.termsVersion,
        consents: { analyticsAnon: false, reminders: true, email: true, push: false },
        patientPrefs: { modalities: [], motives: [], hours: [] },
        ...(data.role === 'psychologist' ? { professional: {
          specialties: data.specialty ? [data.specialty] : [],
          languages: ['es'], modalities: ['online'], isPublicPhone: false, isPublicLocation: false,
          availability: {}, isVerified: false, acceptingNewPatients: true, approvalStatus: 'draft',
          ...(data.licenseNumber ? { licenseNumber: data.licenseNumber } : {}),
          ...(data.description ? { description: data.description } : {}),
        } } : {}),
      };
      await createRegistrationProfile(result.user.uid, profileData);
      await sendEmailVerification(result.user);
      setUser(result.user);
      setProfile({ uid: result.user.uid, ...profileData });
      setClaims(emptyPermissionClaims);
    },
    async loginWithGoogle() {
      setError(null);
      const configuredAuth = requireAuth();
      if (!googleProvider) throw new Error(firebaseConfigurationMessage ?? 'Google Sign-In no está configurado.');
      try {
        const result = await signInWithPopup(configuredAuth, googleProvider);
        await getOrCreateProfile(result.user.uid, result.user.email ?? undefined, result.user.displayName ?? undefined);
      } catch (reason) {
        if (reason instanceof Error && reason.message.includes('popup')) {
          await signInWithRedirect(configuredAuth, googleProvider);
          return;
        }
        throw reason;
      }
    },
    async logout() { await signOut(requireAuth()); },
    async resendVerification() {
      const configuredAuth = requireAuth();
      if (!configuredAuth.currentUser) throw new Error('No hay una sesión activa.');
      await sendEmailVerification(configuredAuth.currentUser);
    },
    async refreshVerification() {
      const configuredAuth = requireAuth();
      if (!configuredAuth.currentUser) return false;
      await reload(configuredAuth.currentUser);
      setUser({ ...configuredAuth.currentUser });
      return Boolean(configuredAuth.currentUser.emailVerified);
    },
    async refreshClaims() {
      const configuredAuth = requireAuth();
      if (!configuredAuth.currentUser) return emptyPermissionClaims;
      const nextClaims = permissionClaimsFromToken(await configuredAuth.currentUser.getIdTokenResult(true));
      setClaims(nextClaims);
      return nextClaims;
    },
    async resetPassword(email) { await sendPasswordResetEmail(requireAuth(), email); },
  }), [claims, error, loading, profile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
