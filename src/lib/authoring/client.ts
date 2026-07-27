import { httpsCallable } from 'firebase/functions';
import { requireFunctions } from '../firebase';
import type { CollaboratorRole } from '../../types/authoring';

const callable = <Request, Response>(name: string) => httpsCallable<Request, Response>(requireFunctions(), name);

export async function setProjectCollaborator(projectId: string, collaborator: { uid: string; role: CollaboratorRole; assignedLocales?: string[]; active?: boolean }) {
  return (await callable<{ projectId: string; collaborator: typeof collaborator }, { projectId: string; uid: string; role: CollaboratorRole }>('setProjectCollaborator')({ projectId, collaborator })).data;
}

export async function transitionInstrumentProject(projectId: string, to: string) {
  return (await callable<{ projectId: string; to: string }, { projectId: string; status: string }>('transitionInstrumentProject')({ projectId, to })).data;
}

export async function publishInstrumentVersion(projectId: string, draftId: string, version: string) {
  return (await callable<{ projectId: string; draftId: string; version: string }, { projectId: string; versionId: string; checksum: string }>('publishInstrumentVersion')({ projectId, draftId, version })).data;
}

export async function withdrawInstrumentVersion(projectId: string, versionId: string) {
  return (await callable<{ projectId: string; versionId: string }, { projectId: string; versionId: string; status: string }>('withdrawInstrumentVersion')({ projectId, versionId })).data;
}

export async function recordProjectApproval(projectId: string, type: 'legal' | 'admin_release', decision: 'approved' | 'rejected' | 'changes_requested', comments = '') {
  return (await callable<{ projectId: string; type: string; decision: string; comments: string }, { projectId: string; approvalId: string }>('recordProjectApproval')({ projectId, type, decision, comments })).data;
}
