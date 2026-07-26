import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { contentByInstrument, getInstrument, instrumentAlgorithms, instrumentRegistry } from '../data/instruments/registry';
import { catalogStatusLabel } from '../data/instruments/statusLabels';
import { scoreInstrument } from '../engine/instrumentEngine';
import { appEnv } from '../lib/env';
import { requireFirestore } from '../lib/firebase';
import { loadPrivateInstrumentPayload, type PrivateReviewPayload } from '../lib/privateInstrumentPayload';
import { useLocale } from '../hooks/useLocale';
import type { AnswerValue } from '../data/instruments/types';

type ReviewStatus = 'in_review' | 'changes_requested' | 'technically_approved' | 'clinically_approved' | 'rejected';
type ReviewLocale = 'es' | 'en' | 'it' | 'fr' | 'de' | 'zh' | 'pt';
const asReviewLocale = (locale: string): ReviewLocale => ['es', 'en', 'it', 'fr', 'de', 'zh', 'pt'].includes(locale) ? locale as ReviewLocale : 'es';

export function ProfessionalReviewPage() {
  const { user, isOwner, isAdmin, isProfessionalReviewer } = useAuth();
  const { locale } = useLocale();
  const [selectedId, setSelectedId] = useState('gad-7');
  const [payload, setPayload] = useState<PrivateReviewPayload | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selected = getInstrument(selectedId);
  const staticPayload = useMemo<PrivateReviewPayload | undefined>(() => {
    const content = contentByInstrument[selectedId]?.[asReviewLocale(locale)] ?? contentByInstrument[selectedId]?.en;
    const algorithm = instrumentAlgorithms[selectedId as keyof typeof instrumentAlgorithms];
    return content && algorithm ? { instrumentId: selectedId, contentVersion: content.contentVersion, algorithmVersion: algorithm.algorithmVersion, locale: content.locale, content, algorithm } : undefined;
  }, [locale, selectedId]);
  const activePayload = payload?.instrumentId === selectedId ? payload : staticPayload;
  const sessionPermission = isOwner ? 'owner' : isAdmin ? 'admin' : isProfessionalReviewer ? 'professional_reviewer' : 'sin permiso';

  async function loadPayload() {
    setError(''); setPayload(undefined);
    if (!selected) return;
    if (staticPayload) { setPayload(staticPayload); return; }
    if (selected.id === 'amas-a' && !appEnv.amasReviewEnabled) { setError('AMAS-A sólo se puede cargar en staging autorizado con VITE_AMAS_REVIEW_ENABLED=true.'); return; }
    setLoading(true);
    try { setPayload(await loadPrivateInstrumentPayload(selected.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el payload privado.'); }
    finally { setLoading(false); }
  }

  return <section className="stack">
    <div className="page-heading"><div><span className="eyebrow">Área protegida</span><h1>Revisión profesional</h1><p>Los estados clínicos cambian sólo con evidencia documentada. Permiso de sesión: {sessionPermission}.</p></div></div>
    <div className="panel table-scroll"><table className="catalog-status-table"><thead><tr><th>Instrumento</th><th>Categoría</th><th>Licencia</th><th>Técnico</th><th>Clínico</th><th>ES</th><th>EN</th><th>IT</th><th>FR</th><th>DE</th><th>ZH</th><th>PT</th><th>Revisión</th></tr></thead><tbody>{instrumentRegistry.map((instrument) => <tr key={instrument.id}><td>{instrument.abbreviation}</td><td>{instrument.subcategory}</td><td>{catalogStatusLabel(instrument.licenseStatus)}</td><td>{catalogStatusLabel(instrument.scoringStatus)}</td><td>{catalogStatusLabel(instrument.clinicalReviewStatus)}</td>{(['es', 'en', 'it', 'fr', 'de', 'zh', 'pt'] as const).map((language) => <td key={language}>{catalogStatusLabel(instrument.localeStatus[language])}</td>)}<td>{instrument.lastReviewedAt ?? '—'}</td></tr>)}</tbody></table></div>
    <div className="panel stack"><label>Instrumento para revisión<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setPayload(undefined); setError(''); }}>{instrumentRegistry.map((instrument) => <option key={instrument.id} value={instrument.id}>{instrument.abbreviation} — {instrument.fullName}</option>)}</select></label>{selected ? <p className="muted">{selected.notes}</p> : null}<div className="row-gap"><button disabled={loading} onClick={() => void loadPayload()}>{loading ? 'Cargando…' : 'Cargar para revisión'}</button></div>{error ? <p className="error" role="alert">{error}</p> : null}{activePayload ? <ReviewRunner payload={activePayload} reviewerId={user?.uid ?? ''} /> : <p className="muted">No hay contenido cargado. Los instrumentos restringidos requieren un payload autorizado y una allowlist de backend.</p>}</div>
  </section>;
}

function ReviewRunner({ payload, reviewerId }: { payload: PrivateReviewPayload; reviewerId: string }) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [score, setScore] = useState<ReturnType<typeof scoreInstrument>>();
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('in_review');
  const [message, setMessage] = useState('');
  const contentById = useMemo(() => Object.fromEntries(payload.content.questions.map((question) => [question.id, question.text])), [payload.content.questions]);
  function setAnswer(id: string, value: AnswerValue) { setAnswers((current) => ({ ...current, [id]: value })); setScore(undefined); }
  function calculate() { setScore(scoreInstrument(payload.algorithm, answers)); }
  async function saveReview() {
    if (!reviewerId) return;
    try {
      await addDoc(collection(requireFirestore(), 'testProfessionalReviews'), {
        instrumentId: payload.instrumentId, contentVersion: payload.contentVersion, algorithmVersion: payload.algorithmVersion, locale: payload.locale,
        reviewerId, status, questionComments: {}, scoringComments: score ? comments : '', interpretationComments: '', translationComments: '', generalComments: comments,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setMessage('Revisión guardada.');
    } catch { setMessage('No se pudo guardar la revisión.'); }
  }
  return <div className="stack"><h2>{payload.content.title}</h2><p>{payload.content.instructions}</p>{payload.algorithm.items.map((item) => <fieldset className="review-question" key={item.id}><legend>{contentById[item.id] ?? item.id}</legend>{item.kind === 'multiple' ? <div className="option-grid">{item.options?.map((option) => { const existing: string[] = Array.isArray(answers[item.id]) ? answers[item.id] as string[] : []; const selected = existing.includes(option.id); return <label className="option-card" key={option.id}><input type="checkbox" checked={selected} onChange={(event) => setAnswer(item.id, event.target.checked ? [...existing, option.id] : existing.filter((value) => value !== option.id))} />{payload.content.optionLabels[option.id] ?? option.id}</label>; })}</div> : item.kind === 'numeric' || item.kind === 'timed' ? <input type="number" min={item.min} max={item.max} value={typeof answers[item.id] === 'number' ? answers[item.id] : ''} onChange={(event) => setAnswer(item.id, Number(event.target.value))} /> : <div className="option-grid">{item.options?.map((option) => <label className={`option-card ${answers[item.id] === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name={item.id} checked={answers[item.id] === option.id} onChange={() => setAnswer(item.id, option.id)} />{payload.content.optionLabels[option.id] ?? option.id}</label>)}</div>}</fieldset>)}<button onClick={calculate}>Calcular puntuación de revisión</button>{score ? <div className="notice"><strong>Total: {score.total}</strong><p>Interpretación: {score.interpretation?.label ?? 'sin rango'}</p>{score.validationErrors.length ? <p>Errores: {score.validationErrors.join(', ')}</p> : null}{score.alerts.map((alert) => <p className="error" key={alert.code}>{alert.message}</p>)}</div> : null}<label>Comentarios generales<textarea value={comments} onChange={(event) => setComments(event.target.value)} rows={4} /></label><label>Decisión de revisión<select value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)}><option value="in_review">En revisión</option><option value="changes_requested">Solicitar correcciones</option><option value="technically_approved">Aprobación técnica</option><option value="clinically_approved">Aprobación clínica</option><option value="rejected">Rechazar</option></select></label><button className="secondary" onClick={() => void saveReview()}>Guardar revisión</button>{message ? <p role="status">{message}</p> : null}</div>;
}
