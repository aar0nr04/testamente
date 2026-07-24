import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

if (!getApps().length) initializeApp();
const database = getFirestore();
const bucket = getStorage().bucket();

type PrivateConfig = { contentVersion: string; algorithmVersion: string; mode: 'review_private' | 'licensed_production'; enabled: boolean; payloadPath: string };
type PrivateAccess = { expiresAt: Timestamp };

function assertReviewer(request: CallableRequest<unknown>): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required.');
  const claims = request.auth.token;
  if (!claims.email_verified) throw new HttpsError('permission-denied', 'A verified email is required.');
  if (!(claims.professional_reviewer === true || claims.admin === true || claims.owner === true)) throw new HttpsError('permission-denied', 'Reviewer access is required.');
  return request.auth.uid;
}

export const getPrivateInstrumentPayload = onCall({ region: 'us-central1', enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
  const reviewerId = assertReviewer(request);
  const instrumentId = request.data?.instrumentId;
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
