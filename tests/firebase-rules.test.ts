import { readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;
const patientA = 'patient-a';
const patientB = 'patient-b';
const psychologist = 'psychologist';
const reviewer = 'reviewer';
const admin = 'admin';
const profile = (uid: string, role: 'patient' | 'psychologist' = 'patient') => ({ uid, role, name: uid, termsAccepted: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({ projectId: 'demo-testamente', firestore: { rules: readFileSync('firestore.rules', 'utf8') }, storage: { rules: readFileSync('storage.rules', 'utf8') } });
});
afterEach(async () => { await testEnv.clearFirestore(); });
afterAll(async () => { await testEnv.cleanup(); });

async function seed(path: string, value: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => { await setDoc(doc(context.firestore(), path), value); });
}

describe('Firestore security rules', () => {
  it('isolates patient results and rejects unauthenticated access', async () => {
    await seed(`users/${patientA}/testResults/result-a`, { userId: patientA, createdAt: new Date(), completedAt: new Date(), instrumentId: 'gad-7' });
    await assertSucceeds(getDoc(doc(testEnv.authenticatedContext(patientA).firestore(), `users/${patientA}/testResults/result-a`)));
    await assertFails(getDoc(doc(testEnv.authenticatedContext(patientB).firestore(), `users/${patientA}/testResults/result-a`)));
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), `users/${patientA}/testResults/result-a`)));
  });

  it('allows a patient to create only their own immutable result with a server timestamp', async () => {
    const database = testEnv.authenticatedContext(patientA).firestore();
    await assertSucceeds(setDoc(doc(database, `users/${patientA}/testResults/result-a`), { userId: patientA, instrumentId: 'gad-7', completedAt: '2026-07-24T00:00:00.000Z', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(database, `users/${patientA}/testResults/result-a`), { userId: patientA, instrumentId: 'gad-7', completedAt: '2026-07-24T00:01:00.000Z', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(database, `users/${patientA}/testResults/result-b`), { userId: patientB, instrumentId: 'gad-7', createdAt: serverTimestamp() }));
  });

  it('does not allow patient, psychologist or reviewer clients to self-assign privileged roles', async () => {
    const patientDatabase = testEnv.authenticatedContext(patientA).firestore();
    await assertSucceeds(setDoc(doc(patientDatabase, `users/${patientA}`), profile(patientA)));
    await assertFails(updateDoc(doc(patientDatabase, `users/${patientA}`), { role: 'admin', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(reviewer, { professional_reviewer: true }).firestore(), `users/${reviewer}`), { ...profile(reviewer), role: 'professional_reviewer' }));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(psychologist).firestore(), `users/${psychologist}`), { ...profile(psychologist, 'psychologist'), premium: true }));
    await seed(`users/${psychologist}`, { ...profile(psychologist, 'psychologist'), professional: { isVerified: false, approvalStatus: 'pending' } });
    await assertFails(updateDoc(doc(testEnv.authenticatedContext(psychologist).firestore(), `users/${psychologist}`), { professional: { isVerified: true, approvalStatus: 'approved' }, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(patientDatabase, `users/${patientA}`), { claims: { admin: true }, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(testEnv.authenticatedContext(psychologist).firestore(), `users/${psychologist}`), { licenseStatus: 'licensed', updatedAt: serverTimestamp() }));
  });

  it('allows editable professional details but never direct approval or publication', async () => {
    await seed(`users/${psychologist}`, { ...profile(psychologist, 'psychologist'), professional: { isVerified: false, approvalStatus: 'pending', specialties: [] } });
    await assertSucceeds(updateDoc(doc(testEnv.authenticatedContext(psychologist).firestore(), `users/${psychologist}`), { professional: { isVerified: false, approvalStatus: 'pending', specialties: ['ansiedad'], languages: ['es'], modalities: ['online'], isPublicPhone: false, isPublicLocation: false, availability: {}, acceptingNewPatients: true }, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(admin, { admin: true }).firestore(), `publicPsychologistProfiles/${psychologist}`), { uid: psychologist, name: 'private bypass' }));
  });

  it('limits appointment and message reads to participants', async () => {
    await seed('appointments/a1', { patientId: patientA, psychologistId: psychologist, participantIds: [patientA, psychologist], status: 'pending', createdAt: new Date(), updatedAt: new Date() });
    await seed('appointments/a1/messages/m1', { senderId: patientA, participantIds: [patientA, psychologist], text: 'private', createdAt: new Date() });
    await assertSucceeds(getDoc(doc(testEnv.authenticatedContext(psychologist).firestore(), 'appointments/a1/messages/m1')));
    await assertFails(getDoc(doc(testEnv.authenticatedContext(patientB).firestore(), 'appointments/a1/messages/m1')));
  });

  it('allows only claimed reviewers to create professional reviews and keeps license writes off the browser', async () => {
    const review = { instrumentId: 'gad-7', contentVersion: '1', algorithmVersion: '1', locale: 'es', reviewerId: reviewer, status: 'in_review', questionComments: {}, scoringComments: '', interpretationComments: '', translationComments: '', generalComments: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await assertFails(setDoc(doc(testEnv.authenticatedContext(patientA).firestore(), 'testProfessionalReviews/r1'), review));
    await assertSucceeds(setDoc(doc(testEnv.authenticatedContext(reviewer, { professional_reviewer: true }).firestore(), 'testProfessionalReviews/r1'), review));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(reviewer, { professional_reviewer: true }).firestore(), 'instrumentLicenses/gad-7'), { status: 'licensed' }));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(admin, { admin: true }).firestore(), 'instrumentLicenses/gad-7'), { status: 'licensed' }));
  });

  it('uses per-project collaborators and keeps versions, staff and audit records immutable to clients', async () => {
    const projectId = 'project-a';
    const editor = 'editor-a';
    const technicalReviewer = 'technical-a';
    const project = { title: 'Original', createdBy: psychologist, ownerId: psychologist, status: 'draft', originType: 'psychologist_original', updatedAt: new Date() };
    const draft = { projectId, status: 'draft', title: 'Borrador', description: '', locales: ['es'], revision: 1, lastEditedBy: psychologist, algorithm: {}, contentVersion: '0.1.0', algorithmVersion: '0.1.0', updatedAt: new Date() };
    await seed(`users/${psychologist}`, { ...profile(psychologist, 'psychologist'), professional: { isVerified: false, approvalStatus: 'draft' } });
    await seed(`users/${editor}`, profile(editor, 'psychologist'));
    await seed(`users/${technicalReviewer}`, profile(technicalReviewer, 'psychologist'));
    await seed(`instrumentProjects/${projectId}`, project);
    await seed(`instrumentProjects/${projectId}/collaborators/${psychologist}`, { uid: psychologist, role: 'owner', active: true });
    await seed(`instrumentProjects/${projectId}/collaborators/${editor}`, { uid: editor, role: 'editor', active: true });
    await seed(`instrumentProjects/${projectId}/collaborators/${technicalReviewer}`, { uid: technicalReviewer, role: 'technical_reviewer', active: true });
    await seed(`instrumentProjects/${projectId}/drafts/draft-a`, draft);
    await assertSucceeds(getDoc(doc(testEnv.authenticatedContext(editor).firestore(), `instrumentProjects/${projectId}`)));
    await assertSucceeds(updateDoc(doc(testEnv.authenticatedContext(editor).firestore(), `instrumentProjects/${projectId}/drafts/draft-a`), { title: 'Borrador editado', lastEditedBy: editor, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(testEnv.authenticatedContext(technicalReviewer).firestore(), `instrumentProjects/${projectId}/drafts/draft-a`), { title: 'No autorizado', lastEditedBy: technicalReviewer, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(editor).firestore(), `instrumentProjects/${projectId}/versions/v-private`), { status: 'candidate' }));
    await seed(`instrumentProjects/${projectId}/versions/v-public`, { status: 'published', version: '1.0.0' });
    await seed(`instrumentProjects/${projectId}/versions/v-private`, { status: 'candidate', version: '1.1.0' });
    await assertSucceeds(getDoc(doc(testEnv.unauthenticatedContext().firestore(), `instrumentProjects/${projectId}/versions/v-public`)));
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), `instrumentProjects/${projectId}/versions/v-private`)));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(admin, { admin: true }).firestore(), 'staffAccess/someone'), { admin: true }));
    await assertFails(setDoc(doc(testEnv.authenticatedContext(admin, { admin: true }).firestore(), 'auditLogs/event-a'), { action: 'bypass' }));
  });

  it('never exposes private instrument payloads through Storage rules', async () => {
    const storage = testEnv.authenticatedContext(reviewer, { professional_reviewer: true }).storage();
    await assertFails(storage.ref('licensed-test-payloads/amas-a/v1.json').getDownloadURL());
    await assertFails(storage.ref('instrument-projects/project-a/draft-attachment.pdf').getDownloadURL());
  });
});
