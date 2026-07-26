import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
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
  if (!permissions.some((permission) => claims[permission] === true)) throw new HttpsError('permission-denied', 'Required permission is missing.');
  return request.auth.uid;
}

function assertReviewer(request: CallableRequest<unknown>): string {
  return assertVerifiedPermission(request, ['professional_reviewer', 'admin', 'owner']);
}

function assertAdministrator(request: CallableRequest<unknown>): string {
  return assertVerifiedPermission(request, ['admin', 'owner']);
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
    licenseNumber: professional.licenseNumber ?? null,
    specialties: Array.isArray(professional.specialties) ? professional.specialties : [],
    languages: Array.isArray(professional.languages) ? professional.languages : [],
    modalities: Array.isArray(professional.modalities) ? professional.modalities : [],
    priceMXN: typeof professional.priceMXN === 'number' ? professional.priceMXN : null,
    sessionMinutes: typeof professional.sessionMinutes === 'number' ? professional.sessionMinutes : null,
    availability: professional.availability && typeof professional.availability === 'object' ? professional.availability : {},
    timeZone: source.timeZone ?? null,
    acceptingNewPatients: professional.acceptingNewPatients === true,
    approvalStatus: 'approved',
    approvedAt: FieldValue.serverTimestamp(),
  };
  if (professional.isPublicPhone === true && typeof source.phone === 'string') profile.phone = source.phone;
  if (professional.isPublicLocation === true) { profile.city = source.city ?? null; profile.state = source.state ?? null; }
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
  await database.collection('adminAudit').add({ actorId, action, targetUid, ...details, createdAt: Timestamp.now() });
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

/** Read-only, minimized data feed for the owner/admin console. */
export const getAdminDashboard = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  assertAdministrator(request);
  const [usersSnapshot, reviewsSnapshot, licensesSnapshot, accessSnapshot, auditSnapshot, payloadAuditSnapshot, authUsers] = await Promise.all([
    database.collection('users').limit(100).get(),
    database.collection('testProfessionalReviews').orderBy('updatedAt', 'desc').limit(100).get(),
    database.collection('instrumentLicenses').limit(100).get(),
    database.collection('privateInstrumentAccess').limit(100).get(),
    database.collection('adminAudit').orderBy('createdAt', 'desc').limit(100).get(),
    database.collection('privatePayloadAudit').orderBy('accessedAt', 'desc').limit(100).get(),
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
    summary: { users: users.length, pendingPsychologists: psychologistsPending.length, reviewers: reviewers.length, instrumentsWithPrivateAccess: accessSnapshot.size, clinicalReviews: reviewsSnapshot.size, licenses: licensesSnapshot.size },
    users, psychologistsPending, reviewers,
    clinicalReviews: reviewsSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    licenses: licensesSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    privateAccesses: accessSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())),
    audit: [...auditSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data())), ...payloadAuditSnapshot.docs.map((snapshot) => dashboardDocument(snapshot.id, snapshot.data()))].sort((left, right) => String(right.createdAt ?? right.accessedAt ?? '').localeCompare(String(left.createdAt ?? left.accessedAt ?? ''))).slice(0, 100),
  };
});
