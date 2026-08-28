import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { useLocale } from '../hooks/useLocale';
import { createQuestionnaireResult, firstInvalidQuestionIndex, scoreCatalogTest } from '../lib/questionnaire';
import { saveResult } from '../lib/resultStore';
import { useAuth } from '../contexts/AuthContext';
import { SafetyNotice } from '../components/tests/SafetyNotice';

type SavedRun = { id?: string; index?: number; answers?: Record<string, string>; started?: boolean };

export function TestRunnerPage() {
  const { testId = '' } = useParams();
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const test = useMemo(() => getTestById(testId, locale), [locale, testId]);
  const navigate = useNavigate();
  const runCacheKey = `testamente:run:${testId}:${locale}:${test?.contentVersion ?? 'unknown'}:${user?.uid ?? 'anonymous'}`;
  const initialRun = useMemo(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(runCacheKey) ?? '{}') as SavedRun;
      return { id: stored.id ?? crypto.randomUUID(), index: stored.index ?? 0, answers: stored.answers ?? {}, started: stored.started ?? false };
    } catch {
      return { id: crypto.randomUUID(), index: 0, answers: {}, started: false };
    }
  }, [runCacheKey]);
  const [runId] = useState(initialRun.id);
  const [index, setIndex] = useState(initialRun.index);
  const [answers, setAnswers] = useState<Record<string, string>>(initialRun.answers);
  const [started, setStarted] = useState(initialRun.started);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const question = test?.questions[index];
  const liveScore = useMemo(() => test?.algorithm ? scoreCatalogTest(test, answers) : undefined, [answers, test]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (started && Object.keys(answers).length) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [answers, started]);

  useEffect(() => {
    sessionStorage.setItem(runCacheKey, JSON.stringify({ id: runId, index, answers, started }));
  }, [answers, index, runCacheKey, runId, started]);

  if (!test || !test.payloadAvailable || !test.algorithm || !question) {
    return <section className="panel stack"><h2>Instrumento no disponible</h2><p>Este instrumento no está publicado para uso público. Si cuentas con autorización, pruébalo desde Revisión profesional.</p></section>;
  }

  const questionId = question.id;
  const selected = answers[questionId];
  const questionText = question.prompt ?? t(question.promptKey ?? questionId);
  const requireCurrentAnswer = () => {
    if (question.required !== false && selected === undefined) {
      setError('Selecciona una opción para continuar.');
      return false;
    }
    return true;
  };

  const next = () => {
    if (!requireCurrentAnswer()) return;
    setError('');
    setIndex((value) => Math.min(value + 1, test.questions.length - 1));
  };

  const finish = async () => {
    if (!requireCurrentAnswer() || !liveScore) return;
    const invalidIndex = firstInvalidQuestionIndex(test, liveScore);
    if (invalidIndex !== undefined) {
      setIndex(invalidIndex);
      setError('Completa todas las preguntas obligatorias para ver el resultado.');
      return;
    }

    setBusy(true);
    const result = createQuestionnaireResult(test, liveScore, answers, runId, user?.uid);
    const outcome = await saveResult(result, user?.uid);
    sessionStorage.removeItem(runCacheKey);
    navigate(`/results/${result.id}`, { state: { result, persistence: outcome } });
  };

  if (!started) {
    return <section className="runner panel stack"><span className="eyebrow">{test.title}</span><h1>Antes de comenzar</h1><p>{test.instructions}</p><div className="notice">Tus respuestas se usan únicamente para calcular este resultado informativo. No equivale a un diagnóstico.</div><button onClick={() => setStarted(true)}>Comenzar cuestionario</button></section>;
  }

  return <section className="runner panel stack">
    <div className="runner-top"><span className="eyebrow">{test.title}</span><span aria-live="polite">{index + 1} / {test.questions.length}</span></div>
    <div className="progress"><span style={{ width: `${((index + 1) / test.questions.length) * 100}%` }} /></div>
    <h1>{questionText}</h1>
    {question.imageQuestion ? <img className="question-image" src={question.imageQuestion} alt="" /> : null}
    <div className="option-grid">{question.options.map((option) => <label className={`option-card ${selected === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name={questionId} checked={selected === option.id} onChange={() => { setAnswers((current) => ({ ...current, [questionId]: option.id })); setError(''); }} /><span>{option.label ?? t(option.labelKey ?? option.id)}</span></label>)}</div>
    <SafetyNotice alerts={liveScore?.alerts ?? []} />
    {error ? <p className="error" role="alert">{error}</p> : null}
    <div className="row-between"><button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Anterior</button>{index === test.questions.length - 1 ? <button disabled={busy} onClick={() => void finish()}>{busy ? 'Guardando…' : 'Ver resultado'}</button> : <button onClick={next}>Siguiente</button>}</div>
  </section>;
}
