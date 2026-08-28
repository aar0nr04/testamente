import { describe, expect, it } from 'vitest';
import { generatedValidationCases, publicationGateErrors, validateAuthoringDraft } from './workflow';
import type { InstrumentDraft, InstrumentProject } from '../../types/authoring';

const draft: InstrumentDraft = { id: 'd1', projectId: 'p1', title: 'Instrumento ficticio', description: '', status: 'draft', revision: 1, locales: ['es'], contentVersion: '0.1.0', algorithmVersion: '0.1.0', lastEditedBy: 'author', algorithm: { instrumentId: 'p1', algorithmVersion: '0.1.0', items: [{ id: 'q1', kind: 'single', options: [{ id: 'no', value: 0 }, { id: 'yes', value: 1 }], scaleWeights: { total: 1 } }], scales: [{ id: 'total', label: 'Total' }], total: { kind: 'sum', ranges: [{ id: 'low', min: 0, max: 1, label: 'Bajo', color: 'green', advice: 'Ficticio' }] } } };
const question = { id: 'q1', kind: 'single' as const, prompt: 'Pregunta ficticia', required: true, order: 1, options: [{ id: 'no', label: 'No', value: 0 }, { id: 'yes', label: 'Sí', value: 1 }], scaleWeights: { total: 1 } };
const project: InstrumentProject = { id: 'p1', slug: 'ficticio', title: 'Instrumento ficticio', description: '', originType: 'psychologist_original', category: 'Ansiedad', subcategory: 'Ficticia', createdBy: 'author', ownerId: 'author', status: 'release_candidate', licenseStatus: 'public_domain', rightsMetadata: { originalityDeclared: true, collaboratorConsentConfirmed: true, publicationAuthorized: true } };

describe('authoring workflow', () => {
  it('detects authoring defects and produces declarative generated cases', () => {
    expect(validateAuthoringDraft(draft, [question])).toEqual([]);
    expect(generatedValidationCases([question], draft.algorithm, 'author')).toHaveLength(6);
    expect(generatedValidationCases([question], draft.algorithm, 'author').every((item) => item.status === 'draft')).toBe(true);
  });
  it('blocks publishing until release notes, validation and independent approvals exist', () => {
    expect(publicationGateErrors(project, draft, [question], [], [], 0)).toContain('validation_failed');
    const validations = generatedValidationCases([question], draft.algorithm, 'author').map((item) => ({ caseId: item.id, passed: true, differences: [], total: 0, algorithmVersion: '0.1.0' }));
    const gated = publicationGateErrors(project, { ...draft, releaseNotes: 'Primera versión' }, [question], validations, [{ id: 'a1', reviewerId: 't', type: 'technical', decision: 'approved' }, { id: 'a2', reviewerId: 'c', type: 'clinical', decision: 'approved' }], 0);
    expect(gated).toEqual([]);
  });
});
