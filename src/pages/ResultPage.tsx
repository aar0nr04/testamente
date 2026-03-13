import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { useLocale } from '../hooks/useLocale';
import { findResultById } from '../lib/resultStore';

export function ResultPage() {
  const { resultId = '' } = useParams();
  const { t } = useLocale();

  const result = useMemo(() => findResultById(resultId), [resultId]);
  const test = useMemo(() => getTestById(result?.testId ?? ''), [result?.testId]);

  if (!result || !test) return <p>{t('result.notFound')}</p>;

  const band = test.resultBands.find((item) => item.id === result.bandId);

  return (
    <section className="stack">
      <h2>{t('result.title')}</h2>
      <p>
        {t('result.score')}: <strong>{result.totalScore}</strong>
      </p>
      <p>{band ? t(band.labelKey) : ''}</p>
      <p>{band ? t(band.adviceKey) : ''}</p>
      <small>
        {t('result.done')}: {new Date(result.completedAt).toLocaleString()}
      </small>
      <div className="row-gap">
        <Link to="/tests" className="button-link">
          {t('result.backToTests')}
        </Link>
        <Link to="/history" className="button-link">
          {t('result.viewHistory')}
        </Link>
      </div>
    </section>
  );
}
