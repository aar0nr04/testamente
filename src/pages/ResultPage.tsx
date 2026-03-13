import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { useLocale } from '../hooks/useLocale';
import type { TestRunResult } from '../types/test';

export function ResultPage() {
  const { resultId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get('testId') ?? '';
  const { t } = useLocale();

  const result = useMemo(() => {
    const raw = sessionStorage.getItem(`testamente:result:${resultId}`);
    if (!raw) return undefined;
    return JSON.parse(raw) as TestRunResult;
  }, [resultId]);

  const test = useMemo(() => getTestById(testId), [testId]);

  if (!result || !test) return <p>Result not found.</p>;

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
      <Link to="/tests" className="button-link">
        Back to tests
      </Link>
    </section>
  );
}
