import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { useLocale } from '../hooks/useLocale';
import { scoreCatalogTest } from '../lib/questionnaire';
import { findResultById, type ResultSaveOutcome } from '../lib/resultStore';
import { useAuth } from '../contexts/AuthContext';
import { SafetyNotice } from '../components/tests/SafetyNotice';
import type { TestRunResult } from '../types/domain';

type ResultState = { result?: TestRunResult; persistence?: ResultSaveOutcome };

function localized(value: string | undefined, t: (key: string) => string): string | undefined {
  return value?.startsWith('tests.') ? t(value) : value;
}

export function ResultPage() {
  const { resultId = '' } = useParams();
  const location = useLocation();
  const { t } = useLocale();
  const { user } = useAuth();
  const state = location.state as ResultState | null;
  const [result, setResult] = useState<TestRunResult | undefined>(state?.result);
  const [loading, setLoading] = useState(!state?.result);

  useEffect(() => {
    if (result) return;
    let active = true;
    void findResultById(resultId, user?.uid).then((found) => {
      if (active) {
        setResult(found);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [result, resultId, user?.uid]);

  const test = result ? getTestById(result.testId, result.locale ?? 'es') : undefined;
  const score = useMemo(() => result && test?.algorithm ? scoreCatalogTest(test, result.answers) : undefined, [result, test]);
  if (loading) return <p role="status">Cargando resultado…</p>;
  if (!result) return <p>{t('result.notFound')}</p>;

  const title = result.title ?? test?.title ?? result.testId;
  const interpretation = localized(result.interpretation ?? score?.interpretation?.label, t) ?? 'Resultado informativo';
  const advice = localized(result.advice ?? score?.interpretation?.advice, t);
  return <section className="stack">
    <div className="result-hero"><span className="eyebrow">Resultado informativo</span><h1>{title}</h1><p>{new Date(result.completedAt).toLocaleString()}</p></div>
    {state?.persistence?.persistence === 'temporary' ? <div className="notice" role="status">{state.persistence.message}</div> : null}
    <SafetyNotice alerts={score?.alerts ?? []} />
    <div className="result-grid">
      <article className="panel score-panel"><span className="score-label">{t('result.score')}</span><strong className="score">{result.totalScore}</strong><h2>{interpretation}</h2>{advice ? <p>{advice}</p> : <p>La puntuación se muestra sin interpretar rangos clínicos no revisados.</p>}</article>
      <article className="panel stack"><h2>Próximos pasos</h2><p>Este resultado no constituye un diagnóstico clínico ni sustituye la atención profesional.</p><div className="row-gap"><Link to="/psychologists" className="button-link">Encontrar profesional</Link><Link to="/tests" className="button-link secondary">Volver al catálogo</Link></div></article>
    </div>
  </section>;
}
