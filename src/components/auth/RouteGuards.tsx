import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { appEnv } from '../../lib/env';
import type { PrivilegedClaim } from '../../types/domain';

export interface RouteAccessState {
  signedIn: boolean;
  emailVerified: boolean;
  appCheckReady: boolean;
  claims: Record<PrivilegedClaim, boolean>;
}

export function canAccessRoute(state: RouteAccessState, permissions: PrivilegedClaim[] = [], verified = false, requiresAppCheck = false): boolean {
  return state.signedIn
    && (!verified || state.emailVerified)
    && (!requiresAppCheck || state.appCheckReady)
    && (permissions.length === 0 || permissions.some((permission) => state.claims[permission]));
}

export function RequireAuth({ verified = false }: { verified?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="status">Cargando sesión…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (verified && !user.emailVerified) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
}

export function RequireVerifiedEmail() {
  return <RequireAuth verified />;
}

/** A professional workspace requires an actual psychologist profile, not a staff claim. */
export function RequirePsychologistProfile() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="status">Cargando sesión…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (profile?.role !== 'psychologist') return <Navigate to="/profile" replace state={{ professionalProfileRequired: true }} />;
  return <Outlet />;
}

export type ProjectPermission = 'read' | 'edit' | 'manage_collaborators' | 'review_technical' | 'review_clinical' | 'translate' | 'submit';
/** Route-level collaborator data must be loaded by the page; this guard preserves an authenticated, verified boundary. */
export function RequireProjectPermission({ permission }: { permission: ProjectPermission }) {
  void permission;
  return <RequireAuth verified />;
}

export function RequirePermission({ anyOf, verified = true, requiresAppCheck = false }: { anyOf: PrivilegedClaim[]; verified?: boolean; requiresAppCheck?: boolean }) {
  const { user, loading, isOwner, isAdmin, isProfessionalReviewer } = useAuth();
  const location = useLocation();
  if (loading) return <p className="status">Cargando sesión…</p>;
  const state: RouteAccessState = {
    signedIn: Boolean(user),
    emailVerified: Boolean(user?.emailVerified),
    appCheckReady: appEnv.useFirebaseEmulators || Boolean(appEnv.appCheckSiteKey),
    claims: { owner: isOwner, admin: isAdmin, professional_reviewer: isProfessionalReviewer },
  };
  if (!state.signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (verified && !state.emailVerified) return <Navigate to="/verify-email" replace />;
  if (requiresAppCheck && !state.appCheckReady) return <section className="panel narrow"><h1>App Check requerido</h1><p>Esta área protegida necesita App Check configurado antes de continuar.</p></section>;
  if (!canAccessRoute(state, anyOf, verified, requiresAppCheck)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function VerifyEmailPage() {
  const { user, resendVerification, refreshVerification, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <section className="panel narrow stack"><span className="eyebrow">Cuenta</span><h2>Verifica tu correo</h2><p>Te enviamos un enlace a <strong>{user.email}</strong>. Verifica el correo y vuelve aquí.</p><div className="row-gap"><button onClick={() => void resendVerification()}>Reenviar correo</button><button className="secondary" onClick={() => void refreshVerification().then((verified) => { if (verified) window.location.assign('/'); })}>Ya lo verifiqué</button><button className="link-button" onClick={() => void logout()}>Cerrar sesión</button></div></section>;
}
