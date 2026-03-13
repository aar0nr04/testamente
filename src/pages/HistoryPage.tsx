import { Link } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { useLocale } from '../hooks/useLocale';
import { listResults } from '../lib/resultStore';

export function HistoryPage() {
  const { t } = useLocale();
  const results = listResults();

  return (
    <section className="stack">
      <h2>{t('history.title')}</h2>
      {results.length === 0 ? <p>{t('history.empty')}</p> : null}
      {results.map((result) => {
        const test = getTestById(result.testId);

        return (
          <article className="card" key={result.id}>
            <h3>{test ? t(test.titleKey) : result.testId}</h3>
            <p>
              {t('result.score')}: <strong>{result.totalScore}</strong>
            </p>
            <small>{new Date(result.completedAt).toLocaleString()}</small>
            <Link className="button-link" to={`/results/${result.id}`}>
              {t('history.openResult')}
            </Link>
          </article>
        );
      })}
    </section>
  );
}
