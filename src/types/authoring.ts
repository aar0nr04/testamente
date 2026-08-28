import type { AnswerKind, AnswerValue, InstrumentAlgorithm, ScoreRange } from '../data/instruments/types';
import type { LocaleCode } from './domain';

export type InstrumentOriginType = 'official_licensed' | 'official_public' | 'platform_original' | 'psychologist_original' | 'institution_original' | 'adaptation' | 'translation';
export type ProjectStatus = 'draft' | 'author_review' | 'technical_review' | 'clinical_review' | 'changes_requested' | 'approved' | 'release_candidate' | 'published' | 'deprecated' | 'archived';
export type CollaboratorRole = 'owner' | 'author' | 'editor' | 'technical_reviewer' | 'clinical_reviewer' | 'translator' | 'viewer';
export type DraftStatus = 'draft' | 'frozen' | 'submitted' | 'superseded';
export type VersionStatus = 'candidate' | 'published' | 'deprecated' | 'withdrawn' | 'archived';
export type ChangeRequestStatus = 'draft' | 'submitted' | 'technical_review' | 'clinical_review' | 'changes_requested' | 'approved' | 'rejected' | 'merged' | 'cancelled';
export type ApprovalType = 'technical' | 'clinical' | 'translation' | 'legal' | 'admin_release';
export type ApprovalDecision = 'approved' | 'rejected' | 'changes_requested';
export type ValidationCaseStatus = 'draft' | 'verified' | 'failed' | 'obsolete';
export type ReviewThreadStatus = 'open' | 'resolved' | 'rejected' | 'converted_to_change_request';
export type ReviewTargetType = 'instrument' | 'question' | 'option' | 'scale' | 'scoring_rule' | 'range' | 'translation' | 'result';
export type AuthoringQuestionKind = AnswerKind | 'text' | 'date' | 'information' | 'consent' | 'section' | 'image' | 'cognitive_task';

export interface RightsMetadata {
  rightsHolder?: string;
  copyrightOwner?: string;
  attribution?: string;
  licenseReference?: string;
  commercialUseAllowed?: boolean;
  derivativeWorksAllowed?: boolean;
  digitalAdministrationAllowed?: boolean;
  publicationTerritories?: string[];
  contractReference?: string;
  ownershipStatus?: 'author_owned' | 'platform_licensee' | 'exclusive_license' | 'nonexclusive_license' | 'work_for_hire' | 'institution_owned' | 'pending';
  agreementVersion?: string;
  originalityDeclared?: boolean;
  collaboratorConsentConfirmed?: boolean;
  publicationAuthorized?: boolean;
}

export interface InstrumentProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  originType: InstrumentOriginType;
  category: string;
  subcategory: string;
  createdBy: string;
  ownerId: string;
  organizationId?: string;
  status: ProjectStatus;
  currentDraftId?: string;
  publishedVersionId?: string;
  licenseStatus: string;
  rightsMetadata: RightsMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectCollaborator {
  uid: string;
  role: CollaboratorRole;
  assignedLocales?: LocaleCode[];
  addedBy: string;
  active: boolean;
}

export interface AuthoringOption { id: string; label: string; value?: number; helpText?: string; }
export interface AuthoringQuestion {
  id: string;
  kind: AuthoringQuestionKind;
  prompt: string;
  helpText?: string;
  required: boolean;
  order: number;
  sectionId?: string;
  options: AuthoringOption[];
  scaleWeights?: Record<string, number>;
  scoreMatrix?: Record<string, Record<string, number>>;
  min?: number;
  max?: number;
  reverse?: boolean;
  conditionalVisibility?: { questionId: string; equals: string };
  notes?: string;
  translations?: Partial<Record<LocaleCode, { prompt: string; helpText?: string; options?: Record<string, string> }>>;
  clinicalAlert?: { code: string; message: string; minimumValue: number };
}

export interface InstrumentDraft {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: DraftStatus;
  revision: number;
  locales: LocaleCode[];
  algorithm: InstrumentAlgorithm;
  contentVersion: string;
  algorithmVersion: string;
  releaseNotes?: string;
  lastEditedBy: string;
  lock?: { uid: string; expiresAt: string };
  updatedAt?: string;
}

export interface InstrumentValidationCase {
  id: string;
  name: string;
  description: string;
  responses: Record<string, AnswerValue>;
  expectedScaleTotals: Record<string, number>;
  expectedInterpretation?: string;
  expectedAlerts: string[];
  createdBy: string;
  source: 'generated' | 'clinical_authorized' | 'technical';
  status: ValidationCaseStatus;
}

export interface ValidationRun { caseId: string; passed: boolean; differences: string[]; total: number; algorithmVersion: string; }
export interface InstrumentVersion { id: string; version: string; contentVersion: string; algorithmVersion: string; localeVersions: Partial<Record<LocaleCode, string>>; sourceDraftId: string; changeRequestId?: string; releaseNotes: string; publishedBy?: string; publishedAt?: string; status: VersionStatus; checksum: string; }
export interface ReviewThread { id: string; targetType: ReviewTargetType; targetId: string; message: string; authorId: string; status: ReviewThreadStatus; createdAt?: string; resolvedAt?: string; resolvedBy?: string; }
export interface ChangeRequest { id: string; baseVersionId?: string; proposedDraftId: string; authorId: string; reason: string; changes: string[]; evidence?: string; status: ChangeRequestStatus; reviewerIds: string[]; decisions: Array<{ reviewerId: string; decision: ApprovalDecision; comments?: string; createdAt?: string }>; }
export interface ProjectApproval { id: string; reviewerId: string; type: ApprovalType; versionId?: string; decision: ApprovalDecision; comments?: string; createdAt?: string; revokedAt?: string; }

export const authoringRoles: Record<CollaboratorRole, string[]> = {
  owner: ['read', 'edit', 'manage_collaborators', 'submit', 'approve', 'publish'],
  author: ['read', 'edit', 'submit'], editor: ['read', 'edit'], technical_reviewer: ['read', 'review_technical'],
  clinical_reviewer: ['read', 'review_clinical'], translator: ['read', 'translate'], viewer: ['read'],
};

export function canCollaborator(role: CollaboratorRole | undefined, permission: string): boolean { return Boolean(role && authoringRoles[role].includes(permission)); }
export type { ScoreRange };
