import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { contentByInstrument, getInstrument, instrumentRegistry } from '../data/instruments/registry';
import { runInstrumentReferenceCases, type ReferenceVerification } from '../data/instruments/referenceCases';
import { getReviewTestById, reviewStateLabels } from '../data/tests';
import { scoreInstrument } from '../engine/instrumentEngine';
import { requireFirestore } from '../lib/firebase';
import { useLocale } from '../hooks/useLocale';
import type { AnswerValue, InstrumentAlgorithm, LocalizedInstrumentContent } from '../data/instruments/types';
import { SafetyNotice } from '../components/tests/SafetyNotice';

type ReviewStatus = 'in_review' | 'changes_requested' | 'technically_approved' | 'clinically_approved' | 'rejected';
type ReviewLocale = 'es' | 'en' | 'it' | 'fr' | 'de' | 'zh' | 'pt';
const asReviewLocale = (locale: string): ReviewLocale => ['es', 'en', 'it', 'fr', 'de', 'zh', 'pt'].includes(locale) ? locale as ReviewLocale : 'es';

type ReviewPayload = {
  instrumentId: string;
  content: LocalizedInstrumentContent;
  algorithm: InstrumentAlgorithm;
  version: string;
  sources: { label: string; url: string }[];
};

function payloadFor(instrumentId: string, locale: ReviewLocale): ReviewPayload | undefined {
  const instrument = getInstrument(instrumentId);
  const reviewedTest = getReviewTestById(instrumentId, locale);
  const content = contentByInstrument[instrumentId]?.[locale];
  if (!instrument || !reviewedTest?.algorithm || !content) return undefined;
  return {
    instrumentId,
    content,
    algorithm: reviewedTest.algorithm,
    version: instrument.version,
    sources: instrument.sourceReferences.map((source) => ({ label: source.label, url: source.url })),
  };
}

export function ProfessionalReviewPage() {
  const { user, isOwner, isAdmin, isProfessionalReviewer } = useAuth();
  const { locale } = useLocale();
  const [searchParams] = useSearchParams();
  const requestedLocale = asReviewLocale(searchParams.get('locale') ?? locale);
  const requestedId = searchParams.get('instrument');
  const available = useMemo(() => instrumentRegistry.flatMap((instrument) => {
    const payload = payloadFor(instrument.id, requestedLocale);
    return payload ? [payload] : [];
  }), [requestedLocale]);
  const defaultId = available.some((item) => item.instrumentId === requestedId) ? requestedId! : available[0]?.instrumentId;
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultId);
  useEffect(() => { setSelectedId(defaultId); }, [defaultId]);
  const payload = selectedId ? payloadFor(selectedId, requestedLocale) : undefined;
  const sessionPermission = isOwner ? 'owner' : isAdmin ? 'admin' : isProfessionalReviewer ? 'professional_reviewer' : 'sin permiso';

  return <section className="stack">
    <div className="page-heading"><div><span className="eyebrow">Área protegida</span><h1>Revisión profesional</h1><p>Permiso de sesión: {sessionPermission}. Esta zona usa Custom Claims, correo verificado y App Check; ninguna decisión clínica se concede desde el navegador.</p></div></div>
    <div className="notice"><strong>Datos de prueba:</strong> los casos de referencia y las respuestas de esta pantalla son técnicos y ficticios. No son resultados de pacientes ni equivalen a aprobación clínica.</div>
    {available.length ? <div className="panel stack"><label>Instrumento implementado para revisión<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{available.map((item) => <option key={item.instrumentId} value={item.instrumentId}>{item.content.title} · {item.content.locale.toUpperCase()}</option>)}</select></label><p className="muted">{reviewStateLabels.review_ready}: el contenido y la puntuación están listos para probar en este idioma, pero el estado público permanece separado.</p></div> : <div className="panel stack"><h2>No hay revisión disponible en {requestedLocale.toUpperCase()}</h2><p>Este idioma no tiene un instrumento completo y técnicamente revisado. GAD-7 y PHQ-9 están disponibles en ES/EN; RSES sólo en EN.</p></div>}
    {payload ? <ReviewRunner key={`${payload.instrumentId}:${payload.content.locale}`} payload={payload} reviewerId={user?.uid ?? ''} /> : null}
    <BlockedInstrumentSummary locale={requestedLocale} />
  </section>;
}

function BlockedInstrumentSummary({ locale }: { locale: ReviewLocale }) {
  const blocked = instrumentRegistry.map((instrument) => ({ instrument, test: getReviewTestById(instrument.id, locale) })).filter(({ test }) => !test);
  return <section className="panel stack"><h2>No disponibles para revisión en este idioma</h2><p>Estos instrumentos no aparecen como cuestionarios para probar. Cada uno conserva su restricción real.</p><div className="stack">{blocked.map(({ instrument }) => {
    const test = getReviewTestById(instrument.id, locale);
    const state = test?.reviewState ?? (['stroop', 'tmt', 'digit-span'].includes(instrument.id) ? 'not_implemented' : ['restricted', 'blocked', 'license_pending', 'expired'].includes(instrument.licenseStatus) ? 'material_or_permission_blocked' : 'not_implemented');
    const reason = ['stroop', 'tmt', 'digit-span'].includes(instrument.id)
      ? 'Sin implementar: falta actividad interactiva, protocolo, cronometraje/puntuación y evidencia. No se afirma equivalencia clínica.'
      : instrument.notes;
    return <article className="card" key={instrument.id}><h3>{instrument.abbreviation}</h3><span className="tag">{reviewStateLabels[state]}</span><p>{reason}</p></article>;
  })}</div></section>;
}

function ReviewRunner({ payload, reviewerId }: { payload: ReviewPayload; reviewerId: string }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [score, setScore] = useState<ReturnType<typeof scoreInstrument>>();
  const [verification, setVerification] = useState<ReferenceVerification[]>();
  const [error, setError] = useState('');
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('in_review');
  const [message, setMessage] = useState('');
  const questionById = useMemo(() => Object.fromEntries(payload.content.questions.map((question) => [question.id, question.text])), [payload.content.questions]);
  const question = payload.algorithm.items[index];
  const liveScore = useMemo(() => scoreInstrument(payload.algorithm, answers), [answers, payload.algorithm]);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setScore(undefined);
    setError('');
  }

  function next() {
    if (question.required !== false && (answers[question.id] === undefined || answers[question.id] === '')) {
      setError('Selecciona una respuesta para continuar.');
      return;
    }
    setIndex((current) => Math.min(current + 1, payload.algorithm.items.length - 1));
  }

  function finish() {
    const calculated = scoreInstrument(payload.algorithm, answers);
    if (calculated.validationErrors.length) {
      const id = calculated.validationErrors[0].split(':', 1)[0];
      const invalidIndex = payload.algorithm.items.findIndex((item) => item.id === id);
      if (invalidIndex >= 0) setIndex(invalidIndex);
      setError('Completa todas las preguntas obligatorias antes de calcular.');
      return;
    }
    setScore(calculated);
    setError('');
  }

  async function saveReview() {
    if (!reviewerId || !score) return;
    try {
      await addDoc(collection(requireFirestore(), 'testProfessionalReviews'), {
        instrumentId: payload.instrumentId,
        contentVersion: payload.content.contentVersion,
        algorithmVersion: payload.algorithm.algorithmVersion,
        locale: payload.content.locale,
        reviewerId,
        status,
        questionComments: {},
        scoringComments: comments,
        interpretationComments: '',
        translationComments: '',
        generalComments: comments,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage('Revisión técnica guardada. Esto no cambia el estado clínico ni publica el instrumento.');
    } catch {
      setMessage('No se pudo guardar la revisión. El cálculo y los casos de referencia no se perdieron.');
    }
  }

  if (!started) {
    return <section className="panel stack"><span className="eyebrow">Implementado para revisión</span><h2>{payload.content.title}</h2><dl className="review-metadata"><div><dt>Versión</dt><dd>{payload.version}</dd></div><div><dt>Contenido</dt><dd>{payload.content.contentVersion}</dd></div><div><dt>Algoritmo</dt><dd>{payload.algorithm.algorithmVersion}</dd></div><div><dt>Idioma</dt><dd>{payload.content.locale.toUpperCase()}</dd></div></dl><p>{payload.content.instructions}</p><p>Fuente: {payload.sources.map((source, index) => <span key={source.url}>{index ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></span>)}</p><button onClick={() => setStarted(true)}>Comenzar revisión</button></section>;
  }

  return <section className="panel stack">
    {!score ? <>
      <div className="runner-top"><span className="eyebrow">{payload.content.title}</span><span aria-live="polite">{index + 1} / {payload.algorithm.items.length}</span></div>
      <div className="progress"><span style={{ width: `${((index + 1) / payload.algorithm.items.length) * 100}%` }} /></div>
      <fieldset className="review-question"><legend>{questionById[question.id] ?? question.id}</legend><ReviewQuestion item={question} labels={payload.content.optionLabels} answer={answers[question.id]} onChange={setAnswer} /></fieldset>
      <SafetyNotice alerts={liveScore.alerts} />
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="row-between"><button className="secondary" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>Anterior</button>{index === payload.algorithm.items.length - 1 ? <button onClick={finish}>Calcular y revisar detalle</button> : <button onClick={next}>Siguiente</button>}</div>
    </> : <ReviewDetail payload={payload} score={score} verification={verification} onRunVerification={() => setVerification(runInstrumentReferenceCases(payload.algorithm))} onRestart={() => { setAnswers({}); setScore(undefined); setIndex(0); setVerification(undefined); setError(''); }} comments={comments} onComments={setComments} status={status} onStatus={setStatus} onSave={() => void saveReview()} message={message} />}
  </section>;
}

function ReviewQuestion({ item, labels, answer, onChange }: { item: InstrumentAlgorithm['items'][number]; labels: Record<string, string>; answer: AnswerValue; onChange: (id: string, value: AnswerValue) => void }) {
  if (item.kind === 'multiple') {
    const selected = Array.isArray(answer) ? answer : [];
    return <div className="option-grid">{item.options?.map((option) => <label className={`option-card ${selected.includes(option.id) ? 'selected' : ''}`} key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => onChange(item.id, event.target.checked ? [...selected, option.id] : selected.filter((value) => value !== option.id))} />{labels[option.id] ?? option.id}</label>)}</div>;
  }
  if (item.kind === 'numeric' || item.kind === 'timed') return <input type="number" min={item.min} max={item.max} value={typeof answer === 'number' ? answer : ''} onChange={(event) => onChange(item.id, Number(event.target.value))} />;
  return <div className="option-grid">{item.options?.map((option) => <label className={`option-card ${answer === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name={item.id} checked={answer === option.id} onChange={() => onChange(item.id, option.id)} />{labels[option.id] ?? option.id}</label>)}</div>;
}

function ReviewDetail({ payload, score, verification, onRunVerification, onRestart, comments, onComments, status, onStatus, onSave, message }: { payload: ReviewPayload; score: ReturnType<typeof scoreInstrument>; verification?: ReferenceVerification[]; onRunVerification: () => void; onRestart: () => void; comments: string; onComments: (value: string) => void; status: ReviewStatus; onStatus: (value: ReviewStatus) => void; onSave: () => void; message: string }) {
  const interpretationRule = payload.algorithm.total.ranges.length
    ? `Suma de ${payload.algorithm.total.scaleIds?.join(', ') ?? 'las subescalas'}; se aplica el rango que contiene el total.`
    : `Suma de ${payload.algorithm.total.scaleIds?.join(', ') ?? 'las subescalas'}; este algoritmo no define un rango clínico.`;
  const responseLabel = (response: AnswerValue) => {
    if (Array.isArray(response)) return response.map((value) => payload.content.optionLabels[value] ?? value).join(', ');
    if (typeof response === 'string') return payload.content.optionLabels[response] ?? response;
    return response === undefined ? '—' : String(response);
  };
  return <div className="stack"><div className="row-between"><div><span className="eyebrow">Detalle reproducible</span><h2>{payload.content.title}</h2></div><button className="secondary" onClick={onRestart}>Nueva ejecución</button></div>
    <dl className="review-metadata"><div><dt>Versión</dt><dd>{payload.version}</dd></div><div><dt>Idioma</dt><dd>{payload.content.locale.toUpperCase()}</dd></div><div><dt>Fuente</dt><dd>{payload.sources.map((source, index) => <span key={source.url}>{index ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></span>)}</dd></div></dl>
    <p><strong>Regla de interpretación:</strong> {interpretationRule}</p>
    <div className="table-scroll"><table className="catalog-status-table"><thead><tr><th>Reactivo</th><th>Respuesta</th><th>Valor original</th><th>Inversión</th><th>Valor puntuado</th><th>Aportaciones</th></tr></thead><tbody>{score.calculation.map((item) => <tr key={item.itemId}><td>{item.itemId}</td><td>{responseLabel(item.response)}</td><td>{item.rawValue ?? '—'}</td><td>{item.reverseApplied ? 'Sí' : 'No'}</td><td>{item.scoredValue ?? '—'}</td><td>{Object.entries(item.contributions).map(([scale, value]) => `${scale}: ${value}`).join(' · ') || '—'}</td></tr>)}</tbody></table></div>
    <div className="result-grid"><article className="notice"><strong>Total: {score.total}</strong><p>Interpretación: {score.interpretation?.label ?? 'Sin rango clínico codificado'}</p></article><article className="notice"><strong>Subescalas</strong>{Object.entries(score.scaleTotals).map(([scale, value]) => <p key={scale}>{scale}: {value}</p>)}</article></div>
    <SafetyNotice alerts={score.alerts} />
    <section className="stack"><div className="row-between"><div><span className="eyebrow">Fixtures técnicos</span><h3>Casos de referencia independientes</h3></div><button onClick={onRunVerification}>Ejecutar verificaciones</button></div><p>Estos casos ficticios comparan resultados esperados definidos fuera del flujo con los obtenidos por el algoritmo. Un aprobado no es aprobación clínica.</p>{verification ? <div className="table-scroll"><table className="catalog-status-table"><thead><tr><th>Caso</th><th>Esperado</th><th>Obtenido</th><th>Estado</th></tr></thead><tbody>{verification.map((result) => <tr key={result.referenceCase.id}><td>{result.referenceCase.name}</td><td>Total {result.referenceCase.expected.total}{result.referenceCase.expected.interpretationId ? ` · ${result.referenceCase.expected.interpretationId}` : ''}</td><td>Total {result.score.total}{result.score.interpretation?.id ? ` · ${result.score.interpretation.id}` : ''}</td><td>{result.passed ? 'Aprobado' : `Fallido: ${result.differences.join(', ')}`}</td></tr>)}</tbody></table></div> : null}</section>
    <label>Comentarios técnicos<textarea rows={4} value={comments} onChange={(event) => onComments(event.target.value)} /></label><label>Decisión de revisión<select value={status} onChange={(event) => onStatus(event.target.value as ReviewStatus)}><option value="in_review">En revisión</option><option value="changes_requested">Solicitar correcciones</option><option value="technically_approved">Aprobación técnica</option><option value="clinically_approved">Aprobación clínica</option><option value="rejected">Rechazar</option></select></label><button className="secondary" onClick={onSave}>Guardar revisión técnica</button>{message ? <p role="status">{message}</p> : null}
  </div>;
}
