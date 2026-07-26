import stressCheck from './stress-check-v1.json';
import { instrumentRegistry } from '../instruments/registry';
import { catalogCategoryFromSubcategory, catalogStatusLabel, type CatalogCategoryId } from '../instruments/statusLabels';
import type { LocaleCode, PsychologicalTest } from '../../types/domain';

export interface CatalogEntry extends PsychologicalTest {
  titleByLocale: Record<string, string>;
  descriptionByLocale: Record<string, string>;
  licenseLabel: string;
  catalogCategory: CatalogCategoryId;
  technicalStatus: string;
  clinicalStatus: string;
  availableLocales: LocaleCode[];
}

const registryMetadata: CatalogEntry[] = instrumentRegistry.map((instrument) => ({
  id: instrument.id, slug: instrument.slug, version: instrument.version,
  title: instrument.fullName, titleByLocale: { es: instrument.fullName, en: instrument.fullName },
  description: instrument.description, descriptionByLocale: { es: instrument.description, en: instrument.description },
  estimatedMinutes: instrument.estimatedMinutes, questionCount: instrument.questionCount, questions: [], group: 'clinicos',
  category: instrument.category, subcategory: instrument.subcategory, tags: instrument.tags, locale: 'es',
  licenseStatus: instrument.licenseStatus === 'permission_not_required' ? 'license_confirmed' : instrument.licenseStatus === 'restricted' ? 'review_only' : instrument.licenseStatus === 'blocked' ? 'blocked' : 'license_pending',
  accessMode: instrument.accessMode === 'public' ? 'public' : 'reviewer_allowlist', payloadAvailable: false,
  licenseLabel: catalogStatusLabel(instrument.licenseStatus),
  catalogCategory: catalogCategoryFromSubcategory(instrument.subcategory),
  technicalStatus: instrument.scoringStatus === 'technical_validated' ? 'technical_validated' : instrument.implementationStatus,
  clinicalStatus: instrument.clinicalReviewStatus === 'clinically_approved' ? 'clinical_validated' : instrument.clinicalReviewStatus,
  availableLocales: instrument.availableLocales,
}));

const localBase = stressCheck as unknown as PsychologicalTest;
const localStress: CatalogEntry = {
  ...localBase,
  resultBands: localBase.resultBands?.map((band) => ({ ...band, min: band.minInclusive ?? band.min, max: band.maxInclusive ?? band.max, label: band.labelKey ?? band.label, advice: band.adviceKey ?? band.advice })) ?? [],
  title: 'Chequeo de Estrés (Corto)', description: 'Un chequeo breve para explorar señales de estrés.',
  titleByLocale: { es: 'Chequeo de Estrés (Corto)', en: 'Stress Check (Short)' },
  descriptionByLocale: { es: 'Un chequeo breve para explorar señales de estrés.', en: 'A short check-in for stress signals.' },
  licenseStatus: 'public_domain', accessMode: 'public', payloadAvailable: true, locale: 'es', licenseLabel: catalogStatusLabel('public_domain'),
  catalogCategory: 'anxiety_stress', technicalStatus: 'technical_validated', clinicalStatus: 'pending', availableLocales: ['es', 'en'],
};

export const testsCatalog: CatalogEntry[] = [localStress, ...registryMetadata];
export const executableTests = testsCatalog.filter((test) => test.payloadAvailable && test.questions.length > 0);
export function getTestById(testId: string): CatalogEntry | undefined { return testsCatalog.find((test) => test.id === testId || test.slug === testId); }
export function getCatalogForLocale(locale: LocaleCode): CatalogEntry[] { void locale; return testsCatalog; }
