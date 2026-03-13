import { NavLink, Outlet } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';

const navItems = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/tests', labelKey: 'nav.tests' },
  { to: '/history', labelKey: 'nav.history' },
  { to: '/login', labelKey: 'nav.login' },
];

export function AppLayout() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Testamente</h1>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active-link' : '')}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <select
            className="locale-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value as 'en' | 'es')}
            aria-label={t('nav.language')}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
