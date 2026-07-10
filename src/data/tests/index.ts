import stressCheck from './stress-check-v1.json';
import androidIndex from './android-index.json';
import type { LocaleCode, PsychologicalTest } from '../../types/domain';

type AndroidIndexItem = { slug: string; title: Record<string, string>; summary: Record<string, string>; group: string; category: string; subcategory: string; tags: string[]; latestVersion: string; locales: string[]; durationMin: number; questionCount: number; access: string; license: string };
export interface CatalogEntry extends PsychologicalTest { titleByLocale: Record<string, string>; descriptionByLocale: Record<string, string>; licenseLabel: string; }
const metadata = (androidIndex.tests as AndroidIndexItem[]).map((item): CatalogEntry => ({ id: item.slug, slug: item.slug, version: item.latestVersion, title: item.title.es, titleByLocale: item.title, description: item.summary.es, descriptionByLocale: item.summary, estimatedMinutes: item.durationMin, questionCount: item.questionCount, questions: [], group: item.group, category: item.category, subcategory: item.subcategory, tags: item.tags, locale: 'es', licenseStatus: item.license.includes('public') ? 'license_pending' : 'review_only', accessMode: 'reviewer_allowlist', payloadAvailable: item.slug === 'amas-a', licenseLabel: item.license }));
const localBase = stressCheck as unknown as PsychologicalTest;
const localStress: CatalogEntry = { ...localBase, resultBands: localBase.resultBands?.map((band) => ({ ...band, min: band.minInclusive ?? band.min, max: band.maxInclusive ?? band.max, label: band.labelKey ?? band.label, advice: band.adviceKey ?? band.advice })) ?? [], title: 'Chequeo de Estrés (Corto)', description: 'Un chequeo breve para explorar señales de estrés.', titleByLocale: { es: 'Chequeo de Estrés (Corto)', en: 'Stress Check (Short)' }, descriptionByLocale: { es: 'Un chequeo breve para explorar señales de estrés.', en: 'A short check-in for stress signals.' }, licenseStatus: 'public_domain', accessMode: 'public', payloadAvailable: true, locale: 'es', licenseLabel: 'public_domain' };
export const testsCatalog: CatalogEntry[] = [localStress, ...metadata];
export const executableTests = testsCatalog.filter((test) => test.payloadAvailable && test.questions.length > 0);
export function getTestById(testId: string): CatalogEntry | undefined { return testsCatalog.find((test) => test.id === testId); }
export function getCatalogForLocale(locale: LocaleCode): CatalogEntry[] { return testsCatalog.filter((test) => test.payloadAvailable && (test.locale === locale || test.titleByLocale[locale])); }
export function getAndroidCatalogIndex() { return androidIndex; }
