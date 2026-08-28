import type { LocaleCode } from '../../types/domain';

export const supportedInstrumentLocales = ['es', 'en', 'it', 'fr', 'de', 'zh', 'pt'] as const;
export type InstrumentLocale = (typeof supportedInstrumentLocales)[number];
export type LocaleStatus = 'missing' | 'draft' | 'translated' | 'translation_review' | 'technical_validated' | 'clinical_validated' | 'published' | 'blocked';
export type InstrumentAccessMode = 'public' | 'review_private' | 'licensed_production';
export type InstrumentImplementationStatus = 'cataloged' | 'algorithm_implemented' | 'content_implemented' | 'blocked_license' | 'blocked_reference_data';
export type InstrumentScoringStatus = 'not_started' | 'implemented' | 'technical_validated' | 'pending_reference_data';
export type ClinicalReviewStatus = 'not_requested' | 'pending' | 'in_review' | 'changes_requested' | 'technically_approved' | 'clinically_approved' | 'rejected';
export type InstrumentLicenseStatus = 'permission_not_required' | 'license_pending' | 'restricted' | 'licensed' | 'expired' | 'blocked';

export interface SourceReference {
  label: string;
  url: string;
  kind: 'primary' | 'official_license' | 'translation' | 'implementation';
}

export interface InstrumentRegistryRecord {
  id: string;
  slug: string;
  fullName: string;
  abbreviation: string;
  authors: string[];
  year: number;
  version: string;
  category: string;
  subcategory: string;
  description: string;
  estimatedMinutes: number;
  questionCount: number;
  tags: string[];
  sourceReferences: SourceReference[];
  licenseStatus: InstrumentLicenseStatus;
  accessMode: InstrumentAccessMode;
  implementationStatus: InstrumentImplementationStatus;
  scoringStatus: InstrumentScoringStatus;
  clinicalReviewStatus: ClinicalReviewStatus;
  availableLocales: InstrumentLocale[];
  localeStatus: Record<InstrumentLocale, LocaleStatus>;
  published: boolean;
  featureFlag: string;
  currentAlgorithmVersion: string;
  currentContentVersion: string;
  lastReviewedAt: string | null;
  reviewedBy: string | null;
  notes: string;
}

export type AnswerValue = string | string[] | number | undefined;
export type AnswerKind = 'single' | 'multiple' | 'likert' | 'yes_no' | 'numeric' | 'timed';

export interface InstrumentOption {
  id: string;
  value: number;
}

export interface InstrumentAlgorithmItem {
  id: string;
  kind: AnswerKind;
  required?: boolean;
  options?: InstrumentOption[];
  min?: number;
  max?: number;
  reverse?: boolean;
  scaleWeights?: Record<string, number>;
  scoreMatrix?: Record<string, Record<string, number>>;
  timeLimitSeconds?: number;
}

export interface ScoreRange {
  id: string;
  min: number;
  max: number;
  label: string;
  color: string;
  advice: string;
}

export interface InstrumentAlgorithm {
  instrumentId: string;
  algorithmVersion: string;
  items: InstrumentAlgorithmItem[];
  scales: { id: string; label: string; ranges?: ScoreRange[] }[];
  total: { kind: 'sum' | 'mean'; scaleIds?: string[]; ranges: ScoreRange[] };
  alerts?: { itemId: string; minimumValue: number; code: string; message: string }[];
}

export interface LocalizedInstrumentContent {
  instrumentId: string;
  contentVersion: string;
  locale: InstrumentLocale;
  title: string;
  instructions: string;
  optionLabels: Record<string, string>;
  questions: { id: string; text: string }[];
}

export interface InstrumentScore {
  instrumentId: string;
  algorithmVersion: string;
  responses: Record<string, AnswerValue>;
  scaleTotals: Record<string, number>;
  total: number;
  interpretation?: ScoreRange;
  alerts: { code: string; message: string }[];
  validationErrors: string[];
  /** Deterministic per-item evidence used by the protected technical review UI. */
  calculation: InstrumentCalculationItem[];
}

export interface InstrumentCalculationItem {
  itemId: string;
  response: AnswerValue;
  rawValue?: number;
  scoredValue?: number;
  reverseApplied: boolean;
  contributions: Record<string, number>;
}

export type InstrumentResultRecord = {
  instrumentId: string;
  instrumentVersion: string;
  algorithmVersion: string;
  contentVersion: string;
  locale: LocaleCode;
  responses: Record<string, AnswerValue>;
  scaleTotals: Record<string, number>;
  interpretation?: string;
  completedAt: string;
  userId?: string;
};
