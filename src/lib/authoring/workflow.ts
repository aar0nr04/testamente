import { scoreInstrument } from '../../engine/instrumentEngine';
import type { InstrumentAlgorithm } from '../../data/instruments/types';
import type { AuthoringQuestion, InstrumentDraft, InstrumentProject, InstrumentValidationCase, ProjectApproval, ProjectStatus, ValidationRun } from '../../types/authoring';

const transitions: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['author_review', 'archived'], author_review: ['technical_review', 'changes_requested', 'draft'], technical_review: ['clinical_review', 'changes_requested'],
  clinical_review: ['approved', 'changes_requested'], changes_requested: ['author_review', 'archived'], approved: ['release_candidate', 'changes_requested'],
  release_candidate: ['published', 'changes_requested'], published: ['deprecated', 'archived'], deprecated: ['archived'], archived: [],
};

export function canTransitionProject(from: ProjectStatus, to: ProjectStatus): boolean { return transitions[from].includes(to); }

export function validateAuthoringDraft(draft: InstrumentDraft, questions: AuthoringQuestion[]): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('title_required');
  if (!questions.length) errors.push('questions_required');
  const ids = new Set<string>();
  for (const question of questions) {
    if (!question.id || ids.has(question.id)) errors.push(`question_id:${question.id || 'missing'}`);
    ids.add(question.id);
    if (['single', 'multiple', 'likert', 'yes_no'].includes(question.kind) && !question.options.length) errors.push(`options_required:${question.id}`);
    if (question.reverse && (question.min === undefined || question.max === undefined || question.min >= question.max)) errors.push(`reverse_range:${question.id}`);
    if (question.options.some((option) => !option.id || !option.label.trim())) errors.push(`invalid_option:${question.id}`);
  }
  const scaleIds = new Set(draft.algorithm.scales.map((scale) => scale.id));
  if (draft.algorithm.scales.some((scale) => !scale.id || !scale.label.trim())) errors.push('invalid_scale');
  for (const question of questions) for (const scaleId of Object.keys(question.scaleWeights ?? {})) if (!scaleIds.has(scaleId)) errors.push(`unknown_scale:${question.id}:${scaleId}`);
  for (const range of draft.algorithm.total.ranges) if (range.min > range.max) errors.push(`invalid_range:${range.id}`);
  const ranges = [...draft.algorithm.total.ranges].sort((a, b) => a.min - b.min);
  for (let index = 1; index < ranges.length; index += 1) if (ranges[index - 1].max >= ranges[index].min) errors.push(`overlapping_ranges:${ranges[index - 1].id}:${ranges[index].id}`);
  return [...new Set(errors)];
}

export function runValidationCases(algorithm: InstrumentAlgorithm, cases: InstrumentValidationCase[]): ValidationRun[] {
  return cases.map((validationCase) => {
    const score = scoreInstrument(algorithm, validationCase.responses);
    const differences: string[] = [];
    for (const [scale, expected] of Object.entries(validationCase.expectedScaleTotals)) if (score.scaleTotals[scale] !== expected) differences.push(`scale:${scale}:${score.scaleTotals[scale] ?? 0}!=${expected}`);
    if (validationCase.expectedInterpretation && score.interpretation?.id !== validationCase.expectedInterpretation) differences.push(`interpretation:${score.interpretation?.id ?? 'none'}!=${validationCase.expectedInterpretation}`);
    const alerts = score.alerts.map((alert) => alert.code).sort();
    if (alerts.join('|') !== [...validationCase.expectedAlerts].sort().join('|')) differences.push('alerts_mismatch');
    if (score.validationErrors.length) differences.push(...score.validationErrors);
    return { caseId: validationCase.id, passed: differences.length === 0, differences, total: score.total, algorithmVersion: algorithm.algorithmVersion };
  });
}

export function generatedValidationCases(questions: AuthoringQuestion[], algorithm: InstrumentAlgorithm, createdBy: string): InstrumentValidationCase[] {
  const answers = (maximum: boolean): Record<string, string | number> => Object.fromEntries(questions.filter((question) => !['information', 'section', 'consent', 'text', 'date', 'image'].includes(question.kind)).map((question) => [question.id, question.options.length ? (maximum ? question.options[question.options.length - 1]?.id ?? '' : question.options[0]?.id ?? '') : maximum ? question.max ?? 0 : question.min ?? 0]));
  return ['minimum', 'maximum', 'mixed', 'incomplete', 'boundary', 'reverse'].map((kind) => {
    const responses = kind === 'maximum' ? answers(true) : kind === 'mixed' ? Object.fromEntries(Object.entries(answers(true)).map(([id, value], itemIndex) => [id, itemIndex % 2 ? value : answers(false)[id]])) : kind === 'incomplete' ? {} : answers(false);
    const score = scoreInstrument(algorithm, responses);
    return { id: `generated-${kind}`, name: `Caso ${kind}`, description: 'Caso generado automáticamente; requiere revisión antes de ser clínico.', responses, expectedScaleTotals: score.scaleTotals, expectedInterpretation: score.interpretation?.id, expectedAlerts: score.alerts.map((alert) => alert.code), createdBy, source: 'generated', status: 'draft' };
  });
}

export function publicationGateErrors(project: InstrumentProject, draft: InstrumentDraft, questions: AuthoringQuestion[], validations: ValidationRun[], approvals: ProjectApproval[], openThreads: number): string[] {
  const errors = validateAuthoringDraft(draft, questions);
  if (project.status !== 'release_candidate') errors.push('release_candidate_required');
  if (draft.status !== 'draft' && draft.status !== 'submitted') errors.push('draft_not_publishable');
  if (project.originType === 'official_licensed' || project.licenseStatus === 'restricted') errors.push('restricted_origin');
  if (project.originType === 'official_licensed' || project.originType === 'adaptation' || project.originType === 'translation') {
    if (!project.rightsMetadata.licenseReference || !project.rightsMetadata.digitalAdministrationAllowed) errors.push('license_not_compatible');
  }
  if (!project.rightsMetadata.originalityDeclared || !project.rightsMetadata.collaboratorConsentConfirmed || !project.rightsMetadata.publicationAuthorized) errors.push('rights_incomplete');
  if (!draft.releaseNotes?.trim()) errors.push('release_notes_required');
  if (!validations.length || validations.some((run) => !run.passed)) errors.push('validation_failed');
  if (!approvals.some((approval) => approval.type === 'technical' && approval.decision === 'approved')) errors.push('technical_approval_required');
  if (!approvals.some((approval) => approval.type === 'clinical' && approval.decision === 'approved')) errors.push('clinical_approval_required');
  if ((project.originType === 'adaptation' || project.originType === 'translation' || project.licenseStatus === 'license_pending') && !approvals.some((approval) => approval.type === 'legal' && approval.decision === 'approved')) errors.push('legal_approval_required');
  if (openThreads > 0) errors.push('open_review_threads');
  return [...new Set(errors)];
}
