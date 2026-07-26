import type { CatalogCategoryId } from '../data/instruments/statusLabels';
import type { CatalogEntry } from '../data/tests';
import type { LocaleCode } from '../types/domain';

export interface CatalogFilters {
  query: string;
  category: CatalogCategoryId | '';
  subcategory: string;
  license: string;
  access: string;
  technical: string;
  clinical: string;
  language: LocaleCode | '';
  payload: '' | 'available' | 'unavailable';
  duration: '' | 'short' | 'medium' | 'long';
  questions: '' | 'brief' | 'standard' | 'extended';
}

export const emptyCatalogFilters: CatalogFilters = { query: '', category: '', subcategory: '', license: '', access: '', technical: '', clinical: '', language: '', payload: '', duration: '', questions: '' };
const allowedCategories = new Set<CatalogCategoryId>(['wellbeing', 'anxiety_stress', 'depression', 'personality', 'cognition_attention', 'resilience_coping', 'mental_health_general']);
const allowedLocales = new Set<LocaleCode>(['es', 'en', 'fr', 'pt', 'it', 'de', 'zh']);

export function filtersFromSearchParams(params: URLSearchParams): CatalogFilters {
  const category = params.get('category') ?? '';
  const language = params.get('language') ?? '';
  return {
    query: params.get('q') ?? '', category: allowedCategories.has(category as CatalogCategoryId) ? category as CatalogCategoryId : '', subcategory: params.get('subcategory') ?? '',
    license: params.get('license') ?? '', access: params.get('access') ?? '', technical: params.get('technical') ?? '', clinical: params.get('clinical') ?? '',
    language: allowedLocales.has(language as LocaleCode) ? language as LocaleCode : '',
    payload: params.get('payload') === 'available' || params.get('payload') === 'unavailable' ? params.get('payload') as 'available' | 'unavailable' : '',
    duration: ['short', 'medium', 'long'].includes(params.get('duration') ?? '') ? params.get('duration') as CatalogFilters['duration'] : '',
    questions: ['brief', 'standard', 'extended'].includes(params.get('questions') ?? '') ? params.get('questions') as CatalogFilters['questions'] : '',
  };
}

export function filtersToSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[string, string]> = [['q', filters.query], ['category', filters.category], ['subcategory', filters.subcategory], ['license', filters.license], ['access', filters.access], ['technical', filters.technical], ['clinical', filters.clinical], ['language', filters.language], ['payload', filters.payload], ['duration', filters.duration], ['questions', filters.questions]];
  entries.forEach(([key, value]) => { if (value) params.set(key, value); });
  return params;
}

function durationBucket(minutes: number): CatalogFilters['duration'] { return minutes <= 3 ? 'short' : minutes <= 10 ? 'medium' : 'long'; }
function questionBucket(count: number): CatalogFilters['questions'] { return count <= 10 ? 'brief' : count <= 30 ? 'standard' : 'extended'; }

export function filterCatalog(entries: CatalogEntry[], filters: CatalogFilters): CatalogEntry[] {
  const query = filters.query.trim().toLocaleLowerCase('es');
  return entries.filter((entry) => {
    const searchText = `${entry.title} ${entry.description} ${(entry.tags ?? []).join(' ')} ${entry.subcategory ?? ''}`.toLocaleLowerCase('es');
    return (!query || searchText.includes(query))
      && (!filters.category || entry.catalogCategory === filters.category)
      && (!filters.subcategory || entry.subcategory === filters.subcategory)
      && (!filters.license || entry.licenseStatus === filters.license)
      && (!filters.access || entry.accessMode === filters.access)
      && (!filters.technical || entry.technicalStatus === filters.technical)
      && (!filters.clinical || entry.clinicalStatus === filters.clinical)
      && (!filters.language || entry.availableLocales.includes(filters.language))
      && (!filters.payload || (filters.payload === 'available') === entry.payloadAvailable)
      && (!filters.duration || durationBucket(entry.estimatedMinutes) === filters.duration)
      && (!filters.questions || questionBucket(entry.questionCount ?? entry.questions.length) === filters.questions);
  });
}

export function catalogSubcategories(entries: CatalogEntry[]): string[] { return [...new Set(entries.map((entry) => entry.subcategory).filter((value): value is string => Boolean(value)))].sort((left, right) => left.localeCompare(right, 'es')); }
