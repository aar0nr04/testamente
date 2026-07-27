import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { requireFirestore } from '../lib/firebase';
import type { AuthoringQuestion, InstrumentDraft, InstrumentProject, InstrumentValidationCase, ProjectCollaborator } from '../types/authoring';

const nowVersion = '0.1.0';
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'instrumento';
const id = () => crypto.randomUUID();

export function emptyDraft(projectId: string, authorId: string, title = 'Instrumento sin título'): InstrumentDraft {
  return { id: id(), projectId, title, description: '', status: 'draft', revision: 1, locales: ['es'], contentVersion: nowVersion, algorithmVersion: nowVersion, lastEditedBy: authorId, algorithm: { instrumentId: projectId, algorithmVersion: nowVersion, items: [], scales: [{ id: 'total', label: 'Total' }], total: { kind: 'sum', ranges: [] } } };
}

export async function createOriginalProject(authorId: string, title = 'Instrumento sin título', originType: 'psychologist_original' | 'institution_original' = 'psychologist_original'): Promise<{ project: InstrumentProject; draft: InstrumentDraft }> {
  const database = requireFirestore();
  const projectId = id();
  const draft = emptyDraft(projectId, authorId, title);
  const project: InstrumentProject = { id: projectId, slug: slugify(title), title, description: '', originType, category: 'Salud mental general', subcategory: 'Instrumento original', createdBy: authorId, ownerId: authorId, status: 'draft', currentDraftId: draft.id, licenseStatus: 'license_pending', rightsMetadata: { ownershipStatus: 'pending', originalityDeclared: false, collaboratorConsentConfirmed: false, publicationAuthorized: false } };
  const batch = writeBatch(database);
  const projectReference = doc(database, 'instrumentProjects', projectId);
  batch.set(projectReference, { ...project, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(doc(projectReference, 'collaborators', authorId), { uid: authorId, role: 'owner', assignedLocales: ['es'], active: true, addedBy: authorId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } satisfies ProjectCollaborator & Record<string, unknown>);
  batch.set(doc(projectReference, 'drafts', draft.id), { ...draft, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await batch.commit();
  return { project, draft };
}

export async function listOwnedProjects(uid: string): Promise<InstrumentProject[]> {
  const snapshot = await getDocs(query(collection(requireFirestore(), 'instrumentProjects'), where('ownerId', '==', uid), orderBy('updatedAt', 'desc'), limit(50)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as InstrumentProject));
}

export async function loadProject(projectId: string): Promise<InstrumentProject | undefined> {
  const snapshot = await getDoc(doc(requireFirestore(), 'instrumentProjects', projectId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as InstrumentProject : undefined;
}

export async function loadDraft(projectId: string, draftId: string): Promise<{ draft: InstrumentDraft; questions: AuthoringQuestion[] } | undefined> {
  const database = requireFirestore();
  const draftSnapshot = await getDoc(doc(database, 'instrumentProjects', projectId, 'drafts', draftId));
  if (!draftSnapshot.exists()) return undefined;
  const questions = await getDocs(query(collection(database, 'instrumentProjects', projectId, 'drafts', draftId, 'questions'), orderBy('order')));
  return { draft: { id: draftSnapshot.id, ...draftSnapshot.data() } as InstrumentDraft, questions: questions.docs.map((item) => ({ id: item.id, ...item.data() } as AuthoringQuestion)) };
}

export class DraftConflictError extends Error { constructor() { super('El borrador cambió en otra sesión. Recarga o crea una copia antes de guardar.'); } }

export async function saveDraft(projectId: string, draft: InstrumentDraft, expectedRevision: number): Promise<number> {
  const reference = doc(requireFirestore(), 'instrumentProjects', projectId, 'drafts', draft.id);
  return runTransaction(requireFirestore(), async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists() || Number(current.data().revision ?? 0) !== expectedRevision) throw new DraftConflictError();
    const nextRevision = expectedRevision + 1;
    transaction.update(reference, { title: draft.title, description: draft.description, locales: draft.locales, algorithm: draft.algorithm, contentVersion: draft.contentVersion, algorithmVersion: draft.algorithmVersion, releaseNotes: draft.releaseNotes ?? '', revision: nextRevision, lastEditedBy: draft.lastEditedBy, lock: draft.lock ?? null, updatedAt: serverTimestamp() });
    return nextRevision;
  });
}

export async function updateProjectMetadata(projectId: string, values: Pick<InstrumentProject, 'title' | 'description' | 'category' | 'subcategory' | 'rightsMetadata'>): Promise<void> {
  await updateDoc(doc(requireFirestore(), 'instrumentProjects', projectId), { ...values, updatedAt: serverTimestamp() });
}

export async function replaceDraftQuestions(projectId: string, draftId: string, questions: AuthoringQuestion[]): Promise<void> {
  const database = requireFirestore();
  const questionCollection = collection(database, 'instrumentProjects', projectId, 'drafts', draftId, 'questions');
  const existing = await getDocs(questionCollection);
  const batch = writeBatch(database);
  const ids = new Set(questions.map((question) => question.id));
  existing.docs.filter((item) => !ids.has(item.id)).forEach((item) => batch.delete(item.ref));
  questions.forEach((question, order) => batch.set(doc(questionCollection, question.id), { ...question, order, updatedAt: serverTimestamp() }));
  await batch.commit();
}

export async function replaceValidationCases(projectId: string, cases: InstrumentValidationCase[]): Promise<void> {
  const database = requireFirestore();
  const batch = writeBatch(database);
  cases.forEach((validationCase) => batch.set(doc(database, 'instrumentProjects', projectId, 'validationCases', validationCase.id), { ...validationCase, updatedAt: serverTimestamp() }, { merge: true }));
  await batch.commit();
}
