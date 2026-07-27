import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { createHash } from 'node:crypto';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

if (!getApps().length) initializeApp();
const database = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

type PrivateConfig = { contentVersion: string; algorithmVersion: string; mode: 'review_private' | 'licensed_production'; enabled: boolean; payloadPath: string };
type PrivateAccess = { expiresAt: Timestamp };
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpsError('invalid-argument', 'Invalid request payload.');
  return value as Record<string, unknown>;
}

function assertVerifiedPermission(request: CallableRequest<unknown>, permissions: string[]): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required.');
  const claims = request.auth.token;
  if (!claims.email_verified) throw new HttpsError('permission-denied', 'A verified email is required.');
  if (typeof claims.staff_expires_at === 'number' && claims.staff_expires_at <= Date.now()) throw new HttpsError('permission-denied', 'Staff access has expired.');
  if (!permissions.some((permission) => claims[permission] === true)) throw new HttpsError('permission-denied', 'Required permission is missing.');
  return request.auth.uid;
}

function assertVerifiedUser(request: CallableRequest<unknown>): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required.');
  if (!request.auth.token.email_verified) throw new HttpsError('permission-denied', 'A verified email is required.');
  return request.auth.uid;
}

function assertReviewer(request: CallableRequest<unknown>): string {
  return assertVerifiedPermission(request, ['professional_reviewer', 'admin', 'owner']);
}

function assertAdministrator(request: CallableRequest<unknown>): string {
  return assertVerifiedPermission(request, ['admin', 'owner']);
}

function assertOwner(request: CallableRequest<unknown>): string {
  return assertVerifiedPermission(request, ['owner']);
}

function toIso(value: unknown): string | undefined {
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined;
}

function publicPsychologistProfile(uid: string, source: DocumentData): Record<string, unknown> {
  const professional = (source.professional ?? {}) as Record<string, unknown>;
  const profile: Record<string, unknown> = {
    uid,
    name: source.name ?? '',
    photoUrl: source.photoUrl ?? null,
    headline: professional.headline ?? null,
    description: professional.description ?? null,
    specialties: Array.isArray(professional.specialties) ? professional.specialties : [],
    languages: Array.isArray(professional.languages) ? professional.languages : [],
    modalities: Array.isArray(professional.modalities) ? professional.modalities : [],
    currency: typeof professional.currency === 'string' ? professional.currency : 'MXN',
    sessionMinutes: typeof professional.sessionMinutes === 'number' ? professional.sessionMinutes : null,
    availability: professional.availability && typeof professional.availability === 'object' ? professional.availability : {},
    timeZone: source.timeZone ?? null,
    acceptingNewPatients: professional.acceptingNewPatients === true,
    professionalLinks: Array.isArray(professional.professionalLinks) ? professional.professionalLinks : [],
    education: Array.isArray(professional.education) ? professional.education : [],
    experience: Array.isArray(professional.experience) ? professional.experience : [],
    publications: Array.isArray(professional.publications) ? professional.publications : [],
    researchAreas: Array.isArray(professional.researchAreas) ? professional.researchAreas : [],
    approvalStatus: 'approved',
    approvedAt: FieldValue.serverTimestamp(),
  };
  if (professional.isPublicPhone === true && typeof source.phone === 'string') profile.phone = source.phone;
  if (professional.isPublicLocation === true) { profile.city = source.city ?? null; profile.state = source.state ?? null; }
  if (professional.isPublicPrice === true && typeof professional.priceMXN === 'number') profile.priceMXN = professional.priceMXN;
  return profile;
}

function dashboardUser(id: string, source: DocumentData): Record<string, unknown> {
  const professional = (source.professional ?? {}) as Record<string, unknown>;
  return {
    uid: id, name: source.name ?? '', email: source.email ?? '', role: source.role ?? 'patient',
    createdAt: toIso(source.createdAt),
    professional: source.role === 'psychologist' ? {
      headline: professional.headline ?? '', approvalStatus: professional.approvalStatus ?? 'pending',
      isVerified: professional.isVerified === true, specialties: professional.specialties ?? [], languages: professional.languages ?? [],
    } : undefined,
  };
}

function dashboardDocument(id: string, source: DocumentData): Record<string, unknown> {
  const copy = { ...source } as Record<string, unknown>;
  for (const [key, value] of Object.entries(copy)) if (value instanceof Timestamp) copy[key] = value.toDate().toISOString();
  return { id, ...copy };
}

async function appendAdminAudit(actorId: string, action: string, targetUid: string, details: Record<string, unknown> = {}) {
  await database.collection('auditLogs').add({ actorId, action, resourceType: 'user', resourceId: targetUid, metadata: details, source: 'callable', timestamp: Timestamp.now() });
}

export const getPrivateInstrumentPayload = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const reviewerId = assertReviewer(request);
  const body = record(request.data);
  const instrumentId = body.instrumentId;
  if (typeof instrumentId !== 'string' || !/^[a-z0-9-]+$/.test(instrumentId)) throw new HttpsError('invalid-argument', 'Invalid instrument id.');
  if (instrumentId === 'amas-a' && process.env.AMAS_REVIEW_ENABLED !== 'true') throw new HttpsError('failed-precondition', 'AMAS-A review is disabled in this environment.');

  const [configSnapshot, accessSnapshot] = await Promise.all([
    database.doc(`privateInstrumentConfigs/${instrumentId}`).get(),
    database.doc(`privateInstrumentAccess/${instrumentId}_${reviewerId}`).get(),
  ]);
  if (!configSnapshot.exists || !accessSnapshot.exists) throw new HttpsError('permission-denied', 'No active private access exists.');
  const config = configSnapshot.data() as PrivateConfig;
  const access = accessSnapshot.data() as PrivateAccess;
  if (!config.enabled || !['review_private', 'licensed_production'].includes(config.mode) || !access.expiresAt || access.expiresAt.toMillis() <= Date.now()) throw new HttpsError('permission-denied', 'Private access has expired or is disabled.');

  let payload: unknown;
  try { const [contents] = await bucket.file(config.payloadPath).download(); payload = JSON.parse(contents.toString('utf8')); }
  catch { throw new HttpsError('not-found', 'The authorized payload is not provisioned.'); }
  await database.collection('privatePayloadAudit').add({ instrumentId, reviewerId, contentVersion: config.contentVersion, algorithmVersion: config.algorithmVersion, accessedAt: Timestamp.now(), source: 'callable' });
  return payload;
});

/** Administrative approval path. Browser clients cannot write public professional profiles. */
export const reviewPsychologistApplication = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertAdministrator(request);
  const body = record(request.data);
  const uid = body.uid;
  const decision = body.decision;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'A psychologist uid is required.');
  if (decision !== 'approved' && decision !== 'rejected' && decision !== 'changes_requested') throw new HttpsError('invalid-argument', 'Invalid review decision.');

  const userReference = database.doc(`users/${uid}`);
  const publicReference = database.doc(`publicPsychologistProfiles/${uid}`);
  await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userReference);
    const source = snapshot.data();
    if (!snapshot.exists || !source || source.role !== 'psychologist') throw new HttpsError('not-found', 'Psychologist profile not found.');
    const currentProfessional = (source.professional ?? {}) as Record<string, unknown>;
    const approved = decision === 'approved';
    transaction.update(userReference, {
      professional: { ...currentProfessional, isVerified: approved, approvalStatus: decision, approvalNote: note || null, approvalUpdatedAt: Timestamp.now() },
      updatedAt: Timestamp.now(),
    });
    if (approved) transaction.set(publicReference, publicPsychologistProfile(uid, source));
    else transaction.delete(publicReference);
  });
  await appendAdminAudit(actorId, `psychologist_${decision}`, uid, { note: note || null });
  return { uid, decision };
});

/** A psychologist may submit their own draft, but never approve it. */
export const submitProfessionalProfile = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const uid = assertVerifiedUser(request);
  const reference = database.doc(`users/${uid}`);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.role !== 'psychologist') throw new HttpsError('failed-precondition', 'A psychologist profile is required.');
  const professional = (snapshot.data()?.professional ?? {}) as Record<string, unknown>;
  if (!['draft', 'changes_requested', 'rejected', 'pending'].includes(String(professional.approvalStatus ?? 'draft'))) throw new HttpsError('failed-precondition', 'This profile cannot be submitted in its current state.');
  await reference.update({ professional: { ...professional, isVerified: false, approvalStatus: 'pending_review', approvalNote: null, approvalUpdatedAt: Timestamp.now() }, updatedAt: Timestamp.now() });
  await database.collection('auditLogs').add({ actorId: uid, action: 'professional_profile_submitted', resourceType: 'user', resourceId: uid, metadata: {}, source: 'callable', timestamp: Timestamp.now() });
  return { uid, approvalStatus: 'pending_review' };
});

/** Read-only, minimized data feed for the owner/admin console. */
export const getAdminDashboard = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  assertAdministrator(request);
  const [usersSnapshot, reviewsSnapshot, licensesSnapshot, accessSnapshot, auditSnapshot, payloadAuditSnapshot, projectsSnapshot, staffSnapshot, changeRequestsSnapshot, versionsSnapshot, authUsers] = await Promise.all([
    database.collection('users').limit(100).get(),
    database.collection('testProfessionalReviews').orderBy('updatedAt', 'desc').limit(100).get(),
    database.collection('instrumentLicenses').limit(100).get(),
    database.collection('privateInstrumentAccess').limit(100).get(),
    database.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get(),
    database.collection('privatePayloadAudit').orderBy('accessedAt', 'desc').limit(100).get(),
    database.collection('instrumentProjects').limit(100).get(),
    database.collection('staffAccess').limit(100).get(),
    database.collectionGroup('changeRequests').limit(100).get(),
    database.collectionGroup('versions').limit(100).get(),
    auth.listUsers(1000),
  ]);
  const users = usersSnapshot.docs.map((snapshot) => dashboardUser(snapshot.id, snapshot.data()));
  const reviewers = authUsers.users.filter((user) => {
    const claims = user.customClaims ?? {};
    return claims.owner === true || claims.admin === true || claims.professional_reviewer === true;
  }).map((user) => ({ uid: user.uid, email: user.email ?? '', displayName: user.displayName ?? '', emailVerified: user.emailVerified, claims: {
    owner: user.customClaims?.owner === true, admin: user.customClaims?.admin === true, professional_reviewer: user.customClaims?.professional_reviewer === true,
  } }));
  const psychologistsPending = users.filter((user) => (user as { role: string }).role === 'psychologist' && (user as { professional?: { approvalStatus?: string } }).professional?.approvalStatus !== 'approved');
  return {
    summary: { users: users.length, pendingPsychologists: psychologistsPending.length, reviewers: reviewers.length, instrumentsWithPrivateAccess: accessSnapshot.size, clinicalReviews: reviewsSnapshot.size, licenses: licensesSnapshot.size, projects: projectsSnapshot.size, changeRequests: changeRequestsSnapshot.size, publications: versionsSnapshot.docs.filter((item) => item.data().status === 'published').length },
    users, psychologistsPending, reviewers, staff: staffSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())), projects: projectsSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())), changeRequests: changeRequestsSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())), publications: versionsSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    clinicalReviews: reviewsSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    licenses: licensesSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    privateAccesses: accessSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    audit: [...auditSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())), ...payloadAuditSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data()))].sort((left, right) => String(right.timestamp ?? right.accessedAt ?? '').localeCompare(String(left.timestamp ?? left.accessedAt ?? ''))).slice(0, 100),
  };
});

type StaffPermissionInput = { uid: string; admin?: boolean; professionalReviewer?: boolean; active?: boolean; expiresAt?: string | null; notes?: string };
const staffClaims = ['admin', 'professional_reviewer'] as const;

/** Owner-only claim administration. It always merges unrelated custom claims. */
export const setStaffPermissions = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertOwner(request);
  const body = record(request.data);
  const action = body.action;
  const input = body.staff as StaffPermissionInput | undefined;
  if (!input || typeof input.uid !== 'string' || !input.uid) throw new HttpsError('invalid-argument', 'A staff uid is required.');
  const user = await auth.getUser(input.uid);
  const currentClaims = { ...(user.customClaims ?? {}) };
  const accessReference = database.doc(`staffAccess/${input.uid}`);
  if (action === 'get') {
    const access = await accessReference.get();
    return { uid: input.uid, claims: { owner: currentClaims.owner === true, admin: currentClaims.admin === true, professionalReviewer: currentClaims.professional_reviewer === true }, staffAccess: access.exists ? dashboardDocument(access.id, access.data() ?? {}) : null };
  }
  if (action !== 'update') throw new HttpsError('invalid-argument', 'Action must be get or update.');
  // Owners are provisioned only by a break-glass administrative process, never by this callable.
  if ('owner' in (body as Record<string, unknown>)) throw new HttpsError('permission-denied', 'Owner claims cannot be changed by this function.');
  const active = input.active !== false;
  let expirationMillis: number | undefined;
  if (input.expiresAt === undefined) expirationMillis = typeof currentClaims.staff_expires_at === 'number' ? currentClaims.staff_expires_at : undefined;
  else if (input.expiresAt !== null) {
    const parsed = Date.parse(input.expiresAt);
    if (!Number.isFinite(parsed) || parsed <= Date.now()) throw new HttpsError('invalid-argument', 'expiresAt must be a future ISO date.');
    expirationMillis = parsed;
  }
  const setClaim = (claim: typeof staffClaims[number], enabled: boolean | undefined) => {
    if (enabled === undefined) return;
    if (active && enabled) currentClaims[claim] = true;
    else delete currentClaims[claim];
  };
  setClaim('admin', input.admin);
  setClaim('professional_reviewer', input.professionalReviewer);
  if (!active) { for (const claim of staffClaims) delete currentClaims[claim]; expirationMillis = undefined; }
  if (expirationMillis) currentClaims.staff_expires_at = expirationMillis;
  else delete currentClaims.staff_expires_at;
  await auth.setCustomUserClaims(input.uid, currentClaims);
  await accessReference.set({ uid: input.uid, admin: currentClaims.admin === true, professionalReviewer: currentClaims.professional_reviewer === true, active, grantedBy: actorId, grantedAt: Timestamp.now(), expiresAt: expirationMillis ? Timestamp.fromMillis(expirationMillis) : null, notes: typeof input.notes === 'string' ? input.notes.slice(0, 1000) : '' }, { merge: true });
  await appendAdminAudit(actorId, 'staff_permissions_updated', input.uid, { admin: currentClaims.admin === true, professionalReviewer: currentClaims.professional_reviewer === true, active, expiresAt: expirationMillis ?? null });
  return { uid: input.uid, claims: { admin: currentClaims.admin === true, professionalReviewer: currentClaims.professional_reviewer === true }, refreshRequired: true };
});

function collaboratorRole(data: DocumentData | undefined): string | undefined { return typeof data?.role === 'string' ? data.role : undefined; }
function canManageProject(actorId: string, actorClaims: Record<string, unknown>, project: DocumentData, collaborator: DocumentData | undefined): boolean {
  return actorClaims.owner === true || actorClaims.admin === true || project.ownerId === actorId || collaboratorRole(collaborator) === 'owner';
}

/** Collaborator assignment is server mediated; project roles never become global claims. */
export const setProjectCollaborator = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertVerifiedUser(request);
  const body = record(request.data);
  const projectId = body.projectId;
  const collaborator = record(body.collaborator);
  const allowedRoles = ['owner', 'author', 'editor', 'technical_reviewer', 'clinical_reviewer', 'translator', 'viewer'];
  if (typeof projectId !== 'string' || typeof collaborator.uid !== 'string' || !allowedRoles.includes(String(collaborator.role))) throw new HttpsError('invalid-argument', 'Invalid project collaborator.');
  const projectReference = database.doc(`instrumentProjects/${projectId}`);
  const actorCollaboratorReference = projectReference.collection('collaborators').doc(actorId);
  const [projectSnapshot, actorCollaboratorSnapshot] = await Promise.all([projectReference.get(), actorCollaboratorReference.get()]);
  if (!projectSnapshot.exists || !canManageProject(actorId, request.auth?.token ?? {}, projectSnapshot.data() ?? {}, actorCollaboratorSnapshot.data())) throw new HttpsError('permission-denied', 'Project owner permission is required.');
  await projectReference.collection('collaborators').doc(collaborator.uid as string).set({ uid: collaborator.uid, role: collaborator.role, assignedLocales: Array.isArray(collaborator.assignedLocales) ? collaborator.assignedLocales : [], active: collaborator.active !== false, addedBy: actorId, updatedAt: Timestamp.now() }, { merge: true });
  await database.collection('auditLogs').add({ actorId, action: 'project_collaborator_updated', resourceType: 'instrumentProject', resourceId: projectId, metadata: { collaboratorId: collaborator.uid, role: collaborator.role }, source: 'callable', timestamp: Timestamp.now() });
  return { projectId, uid: collaborator.uid, role: collaborator.role };
});

const projectTransitions: Record<string, string[]> = { draft: ['author_review', 'archived'], author_review: ['technical_review', 'changes_requested', 'draft'], technical_review: ['clinical_review', 'changes_requested'], clinical_review: ['approved', 'changes_requested'], changes_requested: ['author_review', 'archived'], approved: ['release_candidate', 'changes_requested'], release_candidate: ['published', 'changes_requested'], published: ['deprecated', 'archived'], deprecated: ['archived'], archived: [] };

export const transitionInstrumentProject = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertVerifiedUser(request);
  const body = record(request.data);
  if (typeof body.projectId !== 'string' || typeof body.to !== 'string') throw new HttpsError('invalid-argument', 'projectId and to are required.');
  const reference = database.doc(`instrumentProjects/${body.projectId}`);
  const [project, collaborator] = await Promise.all([reference.get(), reference.collection('collaborators').doc(actorId).get()]);
  if (!project.exists) throw new HttpsError('not-found', 'Project not found.');
  const source = project.data() ?? {};
  const current = String(source.status ?? 'draft');
  if (!(projectTransitions[current] ?? []).includes(body.to)) throw new HttpsError('failed-precondition', 'Invalid project transition.');
  const role = collaboratorRole(collaborator.data());
  const administrative = request.auth?.token.owner === true || request.auth?.token.admin === true;
  const allowed = administrative
    || (body.to === 'author_review' && ['owner', 'author'].includes(role ?? ''))
    || (body.to === 'changes_requested' && ['owner', 'technical_reviewer', 'clinical_reviewer'].includes(role ?? ''))
    || (role === 'technical_reviewer' && ['technical_review', 'changes_requested'].includes(body.to))
    || (role === 'clinical_reviewer' && ['clinical_review', 'approved', 'changes_requested'].includes(body.to));
  if (!allowed) throw new HttpsError('permission-denied', 'Role cannot perform this transition.');
  await reference.update({ status: body.to, updatedAt: Timestamp.now() });
  await database.collection('auditLogs').add({ actorId, action: 'project_transition', resourceType: 'instrumentProject', resourceId: body.projectId, metadata: { from: current, to: body.to }, source: 'callable', timestamp: Timestamp.now() });
  return { projectId: body.projectId, status: body.to };
});

/** Legal and release approvals are administrative evidence, never browser-writable documents. */
export const recordProjectApproval = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertAdministrator(request);
  const body = record(request.data);
  if (typeof body.projectId !== 'string' || !['legal', 'admin_release'].includes(String(body.type)) || !['approved', 'rejected', 'changes_requested'].includes(String(body.decision))) throw new HttpsError('invalid-argument', 'Invalid project approval.');
  const projectReference = database.doc(`instrumentProjects/${body.projectId}`);
  const project = await projectReference.get();
  if (!project.exists) throw new HttpsError('not-found', 'Project not found.');
  if (project.data()?.createdBy === actorId) throw new HttpsError('permission-denied', 'An author cannot approve their own project.');
  const comments = typeof body.comments === 'string' ? body.comments.trim().slice(0, 4000) : '';
  const approvalReference = projectReference.collection('approvals').doc();
  await approvalReference.set({ reviewerId: actorId, type: body.type, decision: body.decision, comments, createdAt: Timestamp.now(), source: 'administrative_callable' });
  await database.collection('auditLogs').add({ actorId, action: 'project_approval_recorded', resourceType: 'instrumentProject', resourceId: body.projectId, metadata: { approvalId: approvalReference.id, type: body.type, decision: body.decision }, source: 'callable', timestamp: Timestamp.now() });
  return { projectId: body.projectId, approvalId: approvalReference.id };
});

/** Freezes a draft into an immutable published version only after server-side gates. */
export const publishInstrumentVersion = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertAdministrator(request);
  const body = record(request.data);
  if (typeof body.projectId !== 'string' || typeof body.draftId !== 'string' || typeof body.version !== 'string') throw new HttpsError('invalid-argument', 'projectId, draftId and version are required.');
  const projectReference = database.doc(`instrumentProjects/${body.projectId}`);
  const draftReference = projectReference.collection('drafts').doc(body.draftId);
  const [projectSnapshot, draftSnapshot, questionsSnapshot, validationSnapshot, approvalsSnapshot, openThreadsSnapshot] = await Promise.all([
    projectReference.get(), draftReference.get(), draftReference.collection('questions').orderBy('order').get(), projectReference.collection('validationCases').get(), projectReference.collection('approvals').get(), projectReference.collection('reviewThreads').where('status', '==', 'open').limit(1).get(),
  ]);
  if (!projectSnapshot.exists || !draftSnapshot.exists) throw new HttpsError('not-found', 'Project or draft not found.');
  const project = projectSnapshot.data() ?? {};
  const draft = draftSnapshot.data() ?? {};
  if (project.status !== 'release_candidate') throw new HttpsError('failed-precondition', 'The project must be a release candidate before publication.');
  if (draft.status !== 'draft' && draft.status !== 'submitted') throw new HttpsError('failed-precondition', 'The selected draft is not publishable.');
  if (project.originType === 'official_licensed' || project.licenseStatus === 'restricted') throw new HttpsError('failed-precondition', 'Licensed or restricted instruments cannot be published through the public workflow.');
  const rights = (project.rightsMetadata ?? {}) as Record<string, unknown>;
  const technical = approvalsSnapshot.docs.some((item) => item.data().type === 'technical' && item.data().decision === 'approved');
  const clinical = approvalsSnapshot.docs.some((item) => item.data().type === 'clinical' && item.data().decision === 'approved');
  const legalRequired = project.originType === 'adaptation' || project.originType === 'translation' || project.licenseStatus === 'license_pending';
  const legal = !legalRequired || approvalsSnapshot.docs.some((item) => item.data().type === 'legal' && item.data().decision === 'approved');
  const questionsComplete = questionsSnapshot.size > 0 && questionsSnapshot.docs.every((item) => typeof item.data().prompt === 'string' && item.data().prompt.trim().length > 0);
  const validationsPass = validationSnapshot.size > 0 && validationSnapshot.docs.every((item) => item.data().status === 'verified');
  if (!questionsComplete || !validationsPass || !technical || !clinical || !legal || !rights.originalityDeclared || !rights.collaboratorConsentConfirmed || !rights.publicationAuthorized || !draft.releaseNotes || !String(draft.releaseNotes).trim() || !openThreadsSnapshot.empty) throw new HttpsError('failed-precondition', 'Publication gates are not satisfied.');
  const snapshot = { project: { id: projectSnapshot.id, title: project.title, originType: project.originType, category: project.category, subcategory: project.subcategory, rightsMetadata: rights }, draft: { ...draft, id: draftSnapshot.id }, questions: questionsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) };
  const checksum = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  const versionReference = projectReference.collection('versions').doc();
  await database.runTransaction(async (transaction) => {
    const latest = await transaction.get(projectReference);
    if (!latest.exists || latest.data()?.publishedVersionId) { /* Multiple immutable versions are allowed; no overwrite occurs. */ }
    transaction.set(versionReference, { version: body.version, contentVersion: draft.contentVersion, algorithmVersion: draft.algorithmVersion, localeVersions: draft.localeVersions ?? {}, sourceDraftId: draftSnapshot.id, releaseNotes: draft.releaseNotes, publishedBy: actorId, publishedAt: Timestamp.now(), status: 'published', checksum, snapshot });
    transaction.update(projectReference, { publishedVersionId: versionReference.id, status: 'published', updatedAt: Timestamp.now() });
    transaction.update(draftReference, { status: 'frozen', frozenAt: Timestamp.now() });
  });
  await database.collection('auditLogs').add({ actorId, action: 'instrument_version_published', resourceType: 'instrumentProject', resourceId: body.projectId, metadata: { versionId: versionReference.id, checksum }, source: 'callable', timestamp: Timestamp.now() });
  return { projectId: body.projectId, versionId: versionReference.id, checksum };
});

export const withdrawInstrumentVersion = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const actorId = assertAdministrator(request);
  const body = record(request.data);
  if (typeof body.projectId !== 'string' || typeof body.versionId !== 'string') throw new HttpsError('invalid-argument', 'projectId and versionId are required.');
  const versionReference = database.doc(`instrumentProjects/${body.projectId}/versions/${body.versionId}`);
  await versionReference.update({ status: 'withdrawn', withdrawnBy: actorId, withdrawnAt: Timestamp.now() });
  await database.collection('auditLogs').add({ actorId, action: 'instrument_version_withdrawn', resourceType: 'instrumentProject', resourceId: body.projectId, metadata: { versionId: body.versionId }, source: 'callable', timestamp: Timestamp.now() });
  return { projectId: body.projectId, versionId: body.versionId, status: 'withdrawn' };
});
