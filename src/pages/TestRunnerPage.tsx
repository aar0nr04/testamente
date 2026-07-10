import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTestById } from '../data/tests';
import { calculateResult, stableQuestionOrder } from '../engine/testEngine';
import { useLocale } from '../hooks/useLocale';
import { saveResult } from '../lib/resultStore';
import { useAuth } from '../contexts/AuthContext';

export function TestRunnerPage() {
  const { testId = '' } = useParams();
  const test = useMemo(() => getTestById(testId), [testId]);
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ordered = useMemo(() => test ? (test.shuffleQuestions ? stableQuestionOrder(test.questions, `${test.id}:${user?.uid ?? 'anonymous'}`) : test.questions) : [], [test, user?.uid]);
  const question = ordered[index];

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (Object.keys(answers).length) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [answers]);

  if (!test || !test.payloadAvailable || !question) return <section className="panel stack"><h2>Instrumento no disponible</h2><p>Este instrumento requiere una integración backend protegida y autorización de revisión. No se expone su contenido en el bundle.</p></section>;

  const questionId = question.id;
  const selected = answers[questionId];
  const questionText = question.prompt ?? t(question.promptKey ?? questionId);
  const next = () => { if (question.required !== false && !selected) { setError('Selecciona una opción para continuar.'); return; } setError(''); setIndex((value) => Math.min(value + 1, ordered.length - 1)); };
  const finish = async () => { if (question.required !== false && !selected) { setError('Selecciona una opción para continuar.'); return; } setBusy(true); const result = calculateResult({ ...test, locale }, answers, user?.uid); try { await saveResult(result, user?.uid); navigate(`/results/${result.id}`, { state: { result } }); } catch { setError('No se pudo guardar el resultado. Intenta de nuevo.'); setBusy(false); } };

  return <section className="runner panel stack"><div className="runner-top"><span className="eyebrow">{test.title}</span><span aria-live="polite">{index + 1} / {ordered.length}</span></div><div className="progress"><span style={{ width: `${((index + 1) / ordered.length) * 100}%` }} /></div><h1>{questionText}</h1>{question.imageQuestion ? <img className="question-image" src={question.imageQuestion} alt="" /> : null}<div className="option-grid">{question.options.map((option) => <label className={`option-card ${selected === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name={questionId} checked={selected === option.id} onChange={() => { setAnswers((current) => ({ ...current, [questionId]: option.id })); setError(''); }} /><span>{option.label ?? t(option.labelKey ?? option.id)}</span></label>)}</div>{error ? <p className="error" role="alert">{error}</p> : null}<div className="row-between"><button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Anterior</button>{index === ordered.length - 1 ? <button disabled={busy} onClick={() => void finish()}>{busy ? 'Guardando…' : 'Ver resultado'}</button> : <button onClick={next}>Siguiente</button>}</div></section>;
}
