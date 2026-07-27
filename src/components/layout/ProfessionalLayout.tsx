import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  ['/', 'Panel'], ['/review', 'Catálogo de revisión'], ['/reviews', 'Mis revisiones'], ['/instruments', 'Mis instrumentos'], ['/instruments/new', 'Crear instrumento'], ['/collaborations', 'Colaboraciones'], ['/changes', 'Versiones y cambios'], ['/validation', 'Casos de validación'], ['/profile', 'Perfil profesional'],
] as const;

export function ProfessionalLayout() {
  const [open, setOpen] = useState(false);
  const { profile, hasStaffAccess } = useAuth();
  const location = useLocation();
  const crumbs = location.pathname.split('/').filter(Boolean).slice(1);
  return <section className="professional-shell">
    <header className="professional-header"><div><span className="eyebrow">Área profesional</span><h1>{profile?.name || 'Espacio profesional'}</h1><nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/professional">Profesional</Link>{crumbs.map((crumb, index) => <span key={`${crumb}-${index}`}>/ {crumb.split('-').join(' ')}</span>)}</nav></div><button className="secondary professional-menu-button" aria-expanded={open} aria-controls="professional-navigation" onClick={() => setOpen((current) => !current)}>Menú</button></header>
    <aside id="professional-navigation" className={`professional-sidebar ${open ? 'open' : ''}`} aria-label="Navegación profesional"><div className="professional-sidebar-heading"><strong>Profesional</strong><button className="link-button" onClick={() => setOpen(false)}>Cerrar</button></div>{navigation.map(([to, label]) => <NavLink key={to} to={`/professional${to}`} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}{hasStaffAccess ? <NavLink to="/admin" onClick={() => setOpen(false)}>Administración</NavLink> : null}</aside>
    <main className="professional-content"><Outlet /></main>
  </section>;
}
