import { TestCard } from '../components/tests/TestCard';
import { testsCatalog } from '../data/tests';
import { useLocale } from '../hooks/useLocale';

export function TestCatalogPage() {
  const { t } = useLocale();

  return (
    <section className="stack">
      <header className="row-between">
        <h2>{t('catalog.title')}</h2>
      </header>
      {testsCatalog.length === 0 ? <p>{t('catalog.empty')}</p> : null}
      <div className="grid">
        {testsCatalog.map((test) => (
          <TestCard key={test.id} test={test} t={t} />
        ))}
      </div>
    </section>
  );
}
