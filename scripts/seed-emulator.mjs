import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.GCLOUD_PROJECT || 'demo-testamente';
if (!process.env.FIRESTORE_EMULATOR_HOST || !projectId.startsWith('demo-')) {
  throw new Error('Este seed sólo puede ejecutarse contra Firestore Emulator con un proyecto demo-*.');
}

if (!getApps().length) initializeApp({ projectId });
const database = getFirestore();
const now = Timestamp.now();
const projectIdValue = 'seed-original-wellbeing';
const batch = database.batch();

batch.set(database.doc('users/seed-psychologist'), {
  uid: 'seed-psychologist', email: 'psychologist@example.test', name: 'Psicóloga de prueba', role: 'psychologist',
  professional: { isVerified: false, approvalStatus: 'draft', specialties: ['bienestar'], languages: ['es'], modalities: ['online'] }, createdAt: now, updatedAt: now,
});
batch.set(database.doc(`instrumentProjects/${projectIdValue}`), {
  id: projectIdValue, slug: 'bienestar-original', title: 'Instrumento original de bienestar', description: 'Datos ficticios para Emulator.',
  originType: 'psychologist_original', category: 'Autoestima y bienestar', subcategory: 'Bienestar', createdBy: 'seed-psychologist', ownerId: 'seed-psychologist',
  status: 'draft', currentDraftId: 'seed-draft', licenseStatus: 'license_pending', rightsMetadata: { ownershipStatus: 'pending', originalityDeclared: false, publicationAuthorized: false }, createdAt: now, updatedAt: now,
});
batch.set(database.doc(`instrumentProjects/${projectIdValue}/collaborators/seed-psychologist`), { uid: 'seed-psychologist', role: 'owner', active: true, assignedLocales: ['es'], addedBy: 'seed-psychologist', createdAt: now, updatedAt: now });
batch.set(database.doc(`instrumentProjects/${projectIdValue}/drafts/seed-draft`), {
  id: 'seed-draft', projectId: projectIdValue, title: 'Instrumento original de bienestar', description: '', status: 'draft', revision: 1, locales: ['es'], contentVersion: '0.1.0', algorithmVersion: '0.1.0', lastEditedBy: 'seed-psychologist',
  algorithm: { instrumentId: projectIdValue, algorithmVersion: '0.1.0', items: [], scales: [{ id: 'total', label: 'Total' }], total: { kind: 'sum', ranges: [] } }, createdAt: now, updatedAt: now,
});
await batch.commit();
console.log(`Seed creado únicamente en Emulator: instrumentProjects/${projectIdValue}`);
