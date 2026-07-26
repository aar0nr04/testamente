import { useEffect, useMemo, useState } from 'react';
import { instrumentRegistry } from '../data/instruments/registry';
import { catalogStatusLabel } from '../data/instruments/statusLabels';
import { loadAdminDashboard, reviewPsychologistApplication, type AdminDashboard, type AdminDecision } from '../lib/admin';

type AdminTab = 'summary' | 'users' | 'pending' | 'reviewers' | 'instruments' | 'reviews' | 'licenses' | 'accesses' | 'audit';
const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'summary', label: 'Resumen' }, { id: 'users', label: 'Usuarios' }, { id: 'pending', label: 'Psicólogos pendientes' },
  { id: 'reviewers', label: 'Revisores' }, { id: 'instruments', label: 'Instrumentos' }, { id: 'reviews', label: 'Revisiones clínicas' },
  { id: 'licenses', label: 'Licencias' }, { id: 'accesses', label: 'Accesos privados' }, { id: 'audit', label: 'Auditoría' },
];

const value = (input: unknown) => input === null || input === undefined ? '—' : Array.isArray(input) ? input.join(', ') : typeof input === 'object' ? JSON.stringify(input) : String(input);

export function AdminPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard>();
  const [tab, setTab] = useState<AdminTab>('summary');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function refresh() {
    setLoading(true); setMessage('');
    try { setDashboard(await loadAdminDashboard()); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No se pudo cargar el panel administrativo.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function decide(uid: string, decision: AdminDecision) {
    const note = window.prompt(decision === 'approved' ? 'Nota opcional de aprobación' : 'Indica la razón para la persona solicitante') ?? '';
    if (decision !== 'approved' && !note.trim()) { setMessage('La devolución o rechazo requiere una nota.'); return; }
    try { await reviewPsychologistApplication(uid, decision, note); setMessage('Solicitud actualizada.'); await refresh(); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'No se pudo actualizar la solicitud.'); }
  }

  const summaryCards = useMemo<Array<[string, number]>>(() => dashboard ? [
    ['Usuarios', dashboard.summary.users], ['Pendientes', dashboard.summary.pendingPsychologists], ['Revisores', dashboard.summary.reviewers],
    ['Accesos privados', dashboard.summary.instrumentsWithPrivateAccess], ['Revisiones', dashboard.summary.clinicalReviews], ['Licencias', dashboard.summary.licenses],
  ] : [], [dashboard]);

  return <section className="stack admin-page">
    <div className="page-heading"><div><span className="eyebrow">Área protegida</span><h1>Administración</h1><p>Las acciones se validan en Cloud Functions con claims, correo verificado y App Check. No hay elevación de privilegios en el navegador.</p></div><button className="secondary" onClick={() => void refresh()} disabled={loading}>Actualizar</button></div>
    <nav className="admin-tabs" aria-label="Secciones de administración">{tabs.map((item) => <button className={tab === item.id ? 'active' : 'secondary'} key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined}>{item.label}</button>)}</nav>
    {message ? <p className="error" role="status">{message}</p> : null}
    {loading ? <p className="status">Cargando datos administrativos…</p> : null}
    {!loading && dashboard ? <AdminSection tab={tab} dashboard={dashboard} onDecision={decide} summaryCards={summaryCards} /> : null}
  </section>;
}

function AdminSection({ tab, dashboard, onDecision, summaryCards }: { tab: AdminTab; dashboard: AdminDashboard; onDecision: (uid: string, decision: AdminDecision) => Promise<void>; summaryCards: Array<[string, number]> }) {
  if (tab === 'summary') return <div className="grid admin-summary">{summaryCards.map(([label, count]) => <article className="card" key={label}><span className="eyebrow">{label}</span><strong className="admin-count">{count}</strong></article>)}</div>;
  if (tab === 'users') return <DataTable rows={dashboard.users} columns={['uid', 'name', 'email', 'role', 'createdAt']} empty="No hay usuarios para mostrar." />;
  if (tab === 'pending') return <div className="stack">{dashboard.psychologistsPending.length === 0 ? <Empty text="No hay psicólogos pendientes." /> : dashboard.psychologistsPending.map((person) => <article className="card" key={person.uid}><div className="row-between"><div><h2>{person.name || person.uid}</h2><p>{person.email}</p><p className="muted">{person.professional?.approvalStatus ?? 'pending'} · {(person.professional?.specialties ?? []).join(', ') || 'sin especialidades'}</p></div><div className="row-gap"><button onClick={() => void onDecision(person.uid, 'approved')}>Aprobar</button><button className="secondary" onClick={() => void onDecision(person.uid, 'changes_requested')}>Devolver</button><button className="danger" onClick={() => void onDecision(person.uid, 'rejected')}>Rechazar</button></div></div></article>)}</div>;
  if (tab === 'reviewers') return <DataTable rows={dashboard.reviewers.map((reviewer) => ({ ...reviewer, permissions: Object.entries(reviewer.claims).filter(([, enabled]) => enabled).map(([claim]) => claim).join(', ') }))} columns={['uid', 'email', 'displayName', 'emailVerified', 'permissions']} empty="No hay cuentas con claims privilegiados." />;
  if (tab === 'instruments') return <DataTable rows={instrumentRegistry.map((instrument) => ({ id: instrument.id, instrumento: instrument.abbreviation, categoría: instrument.subcategory, licencia: catalogStatusLabel(instrument.licenseStatus), técnico: catalogStatusLabel(instrument.scoringStatus), clínico: catalogStatusLabel(instrument.clinicalReviewStatus), acceso: catalogStatusLabel(instrument.accessMode) }))} columns={['instrumento', 'categoría', 'licencia', 'técnico', 'clínico', 'acceso']} empty="No hay instrumentos." />;
  if (tab === 'reviews') return <DataTable rows={dashboard.clinicalReviews} columns={['id', 'instrumentId', 'status', 'reviewerId', 'updatedAt']} empty="No hay revisiones clínicas." />;
  if (tab === 'licenses') return <DataTable rows={dashboard.licenses} columns={['id', 'status', 'updatedAt', 'expiresAt']} empty="No hay licencias registradas." />;
  if (tab === 'accesses') return <DataTable rows={dashboard.privateAccesses} columns={['id', 'instrumentId', 'reviewerId', 'expiresAt']} empty="No hay accesos privados registrados." />;
  return <DataTable rows={dashboard.audit} columns={['id', 'action', 'instrumentId', 'targetUid', 'reviewerId', 'actorId', 'createdAt', 'accessedAt']} empty="No hay eventos de auditoría." />;
}

function DataTable({ rows, columns, empty }: { rows: Array<Record<string, unknown>>; columns: string[]; empty: string }) {
  if (!rows.length) return <Empty text={empty} />;
  return <div className="panel table-scroll"><table className="catalog-status-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? row.uid ?? index)}>{columns.map((column) => <td key={column}>{value(row[column])}</td>)}</tr>)}</tbody></table></div>;
}
function Empty({ text }: { text: string }) { return <div className="empty-state panel"><h2>Sin resultados</h2><p>{text}</p></div>; }
