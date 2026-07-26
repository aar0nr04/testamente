import { NavLink, Outlet, Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';
import { useAuth } from '../../contexts/AuthContext';
import type { LocaleCode } from '../../types/domain';

export function AppLayout() {
  const { locale, setLocale, t } = useLocale();
  const { user, profile, logout, isOwner, isAdmin, isProfessionalReviewer } = useAuth();
  const nav = [{ to: '/', key: 'nav.home' }, { to: '/tests', key: 'nav.tests' }, { to: '/psychologists', label: 'Profesionales' }, { to: '/history', key: 'nav.history' }];
  const canReview = isOwner || isAdmin || isProfessionalReviewer;
  const canAdminister = isOwner || isAdmin;
  return <div className="app-shell"><header className="topbar"><Link to="/" className="brand"><span className="brand-mark">T</span><span>Testamente</span></Link><nav className="main-nav" aria-label="Navegación principal">
    {nav.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.key ? t(item.key) : item.label}</NavLink>)}
    {canReview ? <NavLink to="/professional-review">Revisión</NavLink> : null}
    {canAdminister ? <NavLink to="/admin">Administración</NavLink> : null}
    {user ? <NavLink to="/profile">{profile?.name || 'Perfil'}</NavLink> : <NavLink to="/login">{t('nav.login')}</NavLink>}
    <select value={locale} onChange={(event) => setLocale(event.target.value as LocaleCode)} aria-label={t('nav.language')}>{['es', 'en', 'fr', 'pt', 'it', 'de', 'zh'].map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}</select>
    {user ? <button className="link-button" onClick={() => void logout()}>Salir</button> : null}
  </nav></header><main className="content"><Outlet /></main><footer className="footer">Información de bienestar · No es un diagnóstico clínico</footer></div>;
}
