import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/domain';

export function RequireAuth({ verified = false, roles }: { verified?: boolean; roles?: UserRole[] }) {
  const { user, profile, loading } = useAuth(); const location = useLocation();
  if (loading) return <p className="status">Cargando sesión…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (verified && !user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (roles && (!profile || !roles.includes(profile.role))) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function VerifyEmailPage() {
  const { user, resendVerification, refreshVerification, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <section className="panel narrow stack"><span className="eyebrow">Cuenta</span><h2>Verifica tu correo</h2><p>Te enviamos un enlace a <strong>{user.email}</strong>. Verifica el correo y vuelve aquí.</p><div className="row-gap"><button onClick={() => void resendVerification()}>Reenviar correo</button><button className="secondary" onClick={() => void refreshVerification().then((verified) => { if (verified) window.location.assign('/'); })}>Ya lo verifiqué</button><button className="link-button" onClick={() => void logout()}>Cerrar sesión</button></div></section>;
}
