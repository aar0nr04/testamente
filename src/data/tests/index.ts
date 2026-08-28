import stressCheck from './stress-check-v1.json';
import { contentByInstrument, getInstrument, instrumentAlgorithms, instrumentRegistry } from '../instruments/registry';
import { catalogCategoryFromSubcategory, catalogStatusLabel, type CatalogCategoryId } from '../instruments/statusLabels';
import type { InstrumentAlgorithm, InstrumentLocale, LocalizedInstrumentContent } from '../instruments/types';
import type { LocaleCode, PsychologicalTest, TestOption, TestQuestion } from '../../types/domain';

export interface CatalogEntry extends PsychologicalTest {
  titleByLocale: Record<string, string>;
  descriptionByLocale: Record<string, string>;
  licenseLabel: string;
  catalogCategory: CatalogCategoryId;
  technicalStatus: string;
  clinicalStatus: string;
  availableLocales: LocaleCode[];
  /** Scoring and item data are present only for an exact, technically reviewed locale. */
  algorithm?: InstrumentAlgorithm;
  instructions?: string;
  contentLocale?: InstrumentLocale;
  reviewAvailable?: boolean;
  reviewState: ReviewState;
  reviewReason: string;
  sourceReferences: { label: string; url: string }[];
}

export type ReviewState = 'not_implemented' | 'review_ready' | 'material_or_permission_blocked' | 'publication_approved';

export const reviewStateLabels: Record<ReviewState, string> = {
  not_implemented: 'Sin implementar',
  review_ready: 'Implementado para revisión',
  material_or_permission_blocked: 'Bloqueado por material o permiso',
  publication_approved: 'Aprobado para publicación',
};

const reviewedLocaleStatuses = new Set(['technical_validated', 'clinical_validated', 'published']);

function asInstrumentLocale(locale: LocaleCode): InstrumentLocale {
  return locale as InstrumentLocale;
}

function questionsFromContent(content: LocalizedInstrumentContent, algorithm: InstrumentAlgorithm): TestQuestion[] {
  const textById = new Map(content.questions.map((question) => [question.id, question.text]));
  return algorithm.items.map((item) => ({
    id: item.id,
    prompt: textById.get(item.id) ?? item.id,
    type: item.kind,
    required: item.required,
    options: (item.options ?? []).map((option): TestOption => ({
      id: option.id,
      label: content.optionLabels[option.id] ?? option.id,
      value: option.value,
      score: option.value,
    })),
  }));
}

function reviewStatus(instrument: ReturnType<typeof getInstrument>, locale: LocaleCode, reviewAvailable: boolean): Pick<CatalogEntry, 'reviewState' | 'reviewReason'> {
  if (!instrument) throw new Error('Instrument metadata is required.');
  if (instrument.published && instrument.clinicalReviewStatus === 'clinically_approved') return { reviewState: 'publication_approved', reviewReason: 'La versión publicada cuenta con sus revisiones registradas.' };
  if (reviewAvailable) return { reviewState: 'review_ready', reviewReason: 'Contenido, algoritmo e idioma técnicamente revisados; requiere acceso de revisión autorizado.' };
  if (['stroop', 'tmt', 'digit-span'].includes(instrument.id)) return { reviewState: 'not_implemented', reviewReason: 'Falta una actividad interactiva con protocolo, cronometraje, puntuación y evidencia propios; no se presenta como cuestionario validable.' };
  if (['restricted', 'blocked', 'license_pending', 'expired'].includes(instrument.licenseStatus) || ['blocked_license', 'blocked_reference_data'].includes(instrument.implementationStatus)) return { reviewState: 'material_or_permission_blocked', reviewReason: instrument.notes };
  const localeStatus = instrument.localeStatus[asInstrumentLocale(locale)];
  return { reviewState: 'not_implemented', reviewReason: localeStatus === 'translation_review' ? 'La traducción de este idioma sigue en revisión; no se usa como contenido validable.' : 'Falta contenido, algoritmo o interfaz para este idioma.' };
}

function registryEntry(id: string, locale: LocaleCode): CatalogEntry {
  const instrument = getInstrument(id);
  if (!instrument) throw new Error(`Unknown instrument: ${id}`);
  const content = contentByInstrument[instrument.id]?.[asInstrumentLocale(locale)];
  const algorithm = instrumentAlgorithms[instrument.id as keyof typeof instrumentAlgorithms];
  const localeReviewed = reviewedLocaleStatuses.has(instrument.localeStatus[asInstrumentLocale(locale)]);
  const reviewAvailable = Boolean(content && algorithm && localeReviewed);
  const questions = reviewAvailable && content && algorithm ? questionsFromContent(content, algorithm) : [];
  const status = reviewStatus(instrument, locale, reviewAvailable);

  return {
    id: instrument.id,
    slug: instrument.slug,
    version: instrument.version,
    algorithmVersion: instrument.currentAlgorithmVersion,
    contentVersion: instrument.currentContentVersion,
    title: content?.title ?? instrument.fullName,
    titleByLocale: { es: instrument.fullName, en: instrument.fullName },
    description: instrument.description,
    descriptionByLocale: { es: instrument.description, en: instrument.description },
    estimatedMinutes: instrument.estimatedMinutes,
    questionCount: instrument.questionCount,
    questions,
    group: 'clinicos',
    category: instrument.category,
    subcategory: instrument.subcategory,
    tags: instrument.tags,
    locale,
    licenseStatus: instrument.licenseStatus === 'permission_not_required' ? 'license_confirmed' : instrument.licenseStatus === 'restricted' ? 'review_only' : instrument.licenseStatus === 'blocked' ? 'blocked' : 'license_pending',
    accessMode: instrument.accessMode === 'public' ? 'public' : 'reviewer_allowlist',
    // Publication always remains an explicit clinical/release decision. A complete payload is not a public release.
    payloadAvailable: Boolean(reviewAvailable && instrument.published),
    licenseLabel: catalogStatusLabel(instrument.licenseStatus),
    catalogCategory: catalogCategoryFromSubcategory(instrument.subcategory),
    technicalStatus: instrument.scoringStatus === 'technical_validated' ? 'technical_validated' : instrument.implementationStatus,
    clinicalStatus: instrument.clinicalReviewStatus === 'clinically_approved' ? 'clinical_validated' : instrument.clinicalReviewStatus,
    availableLocales: instrument.availableLocales,
    sourceReferences: instrument.sourceReferences.map((source) => ({ label: source.label, url: source.url })),
    ...status,
    ...(reviewAvailable && content && algorithm ? { algorithm, instructions: content.instructions, contentLocale: content.locale, reviewAvailable: true } : {}),
  };
}

const localBase = stressCheck as unknown as PsychologicalTest;
const stressAlgorithm: InstrumentAlgorithm = {
  instrumentId: localBase.id,
  algorithmVersion: '2026.08.1',
  items: localBase.questions.map((question) => ({
    id: question.id,
    kind: 'likert',
    options: question.options.map((option) => ({ id: option.id, value: option.score ?? 0 })),
    scaleWeights: { total: 1 },
  })),
  scales: [{ id: 'total', label: 'Estrés' }],
  total: {
    kind: 'sum',
    scaleIds: ['total'],
    ranges: (localBase.resultBands ?? []).map((band) => ({
      id: band.id ?? 'range',
      min: band.minInclusive ?? band.min,
      max: band.maxInclusive ?? band.max,
      label: band.labelKey ?? band.label,
      advice: band.adviceKey ?? band.advice ?? '',
      color: band.color ?? 'neutral',
    })),
  },
};

function localStressEntry(locale: LocaleCode): CatalogEntry {
  return {
    ...localBase,
    algorithmVersion: stressAlgorithm.algorithmVersion,
    contentVersion: '2026.08.1',
    resultBands: localBase.resultBands?.map((band) => ({ ...band, min: band.minInclusive ?? band.min, max: band.maxInclusive ?? band.max, label: band.labelKey ?? band.label, advice: band.adviceKey ?? band.advice })) ?? [],
    title: locale === 'en' ? 'Stress Check (Short)' : 'Chequeo de Estrés (Corto)',
    description: locale === 'en' ? 'A short check-in for stress signals.' : 'Un chequeo breve para explorar señales de estrés.',
    titleByLocale: { es: 'Chequeo de Estrés (Corto)', en: 'Stress Check (Short)' },
    descriptionByLocale: { es: 'Un chequeo breve para explorar señales de estrés.', en: 'A short check-in for stress signals.' },
    licenseStatus: 'public_domain',
    accessMode: 'public',
    payloadAvailable: true,
    locale,
    licenseLabel: catalogStatusLabel('public_domain'),
    catalogCategory: 'anxiety_stress',
    technicalStatus: 'technical_validated',
    clinicalStatus: 'pending',
    availableLocales: ['es', 'en'],
    algorithm: stressAlgorithm,
    instructions: locale === 'en'
      ? 'Answer every item based on how often it has applied to you recently. This short check-in is informational and is not a diagnosis.'
      : 'Responde cada reactivo según la frecuencia con que te ha ocurrido recientemente. Este chequeo es informativo y no equivale a un diagnóstico.',
    contentLocale: locale === 'en' ? 'en' : 'es',
    reviewAvailable: true,
    reviewState: 'publication_approved',
    reviewReason: 'Chequeo informativo propio activo para publicación; no equivale a un instrumento clínico aprobado.',
    sourceReferences: [],
  };
}

export function getCatalogForLocale(locale: LocaleCode): CatalogEntry[] {
  return [localStressEntry(locale), ...instrumentRegistry.map((instrument) => registryEntry(instrument.id, locale))];
}

export const testsCatalog: CatalogEntry[] = getCatalogForLocale('es');
export const executableTests = testsCatalog.filter((test) => test.payloadAvailable && test.questions.length > 0);

export function getTestById(testId: string, locale: LocaleCode = 'es'): CatalogEntry | undefined {
  return getCatalogForLocale(locale).find((test) => test.id === testId || test.slug === testId);
}

/** Returns a runnable payload for the protected professional-review route only. */
export function getReviewTestById(testId: string, locale: LocaleCode = 'es'): CatalogEntry | undefined {
  const test = getTestById(testId, locale);
  return test?.reviewAvailable ? { ...test, payloadAvailable: true } : undefined;
}
