import { Link } from 'react-router-dom';
import { useLocale } from '../hooks/useLocale';

export function HomePage() {
  const { t } = useLocale();

  return (
    <section className="stack">
      <h2>Testamente</h2>
      <p>{t('app.subtitle')}</p>
      <Link to="/tests" className="button-link">
        {t('home.cta')}
      </Link>
    </section>
  );
}
