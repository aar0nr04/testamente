import stressCheck from './stress-check-v1.json';
import { instrumentRegistry } from '../instruments/registry';
import type { LocaleCode, PsychologicalTest } from '../../types/domain';

export interface CatalogEntry extends PsychologicalTest {
  titleByLocale: Record<string, string>;
  descriptionByLocale: Record<string, string>;
  licenseLabel: string;
}

const registryMetadata: CatalogEntry[] = instrumentRegistry.map((instrument) => ({
  id: instrument.id,
  slug: instrument.slug,
  version: instrument.version,
  title: instrument.fullName,
  titleByLocale: { es: instrument.fullName, en: instrument.fullName },
  description: instrument.description,
  descriptionByLocale: { es: instrument.description, en: instrument.description },
  estimatedMinutes: instrument.estimatedMinutes,
  questionCount: instrument.questionCount,
  questions: [],
  group: 'clinicos',
  category: instrument.category,
  subcategory: instrument.subcategory,
  tags: instrument.tags,
  locale: 'es',
  licenseStatus: instrument.licenseStatus === 'permission_not_required' ? 'license_confirmed' : instrument.licenseStatus === 'restricted' ? 'review_only' : 'license_pending',
  accessMode: instrument.accessMode === 'public' ? 'public' : 'reviewer_allowlist',
  payloadAvailable: false,
  licenseLabel: `${instrument.licenseStatus} · ${instrument.implementationStatus}`,
}));

const localBase = stressCheck as unknown as PsychologicalTest;
const localStress: CatalogEntry = { ...localBase, resultBands: localBase.resultBands?.map((band) => ({ ...band, min: band.minInclusive ?? band.min, max: band.maxInclusive ?? band.max, label: band.labelKey ?? band.label, advice: band.adviceKey ?? band.advice })) ?? [], title: 'Chequeo de Estrés (Corto)', description: 'Un chequeo breve para explorar señales de estrés.', titleByLocale: { es: 'Chequeo de Estrés (Corto)', en: 'Stress Check (Short)' }, descriptionByLocale: { es: 'Un chequeo breve para explorar señales de estrés.', en: 'A short check-in for stress signals.' }, licenseStatus: 'public_domain', accessMode: 'public', payloadAvailable: true, locale: 'es', licenseLabel: 'internal_wellbeing_check' };

export const testsCatalog: CatalogEntry[] = [localStress, ...registryMetadata];
export const executableTests = testsCatalog.filter((test) => test.payloadAvailable && test.questions.length > 0);
export function getTestById(testId: string): CatalogEntry | undefined { return testsCatalog.find((test) => test.id === testId || test.slug === testId); }
export function getCatalogForLocale(locale: LocaleCode): CatalogEntry[] { void locale; return testsCatalog; }
