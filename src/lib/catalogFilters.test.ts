import { describe, expect, it } from 'vitest';
import { testsCatalog } from '../data/tests';
import { emptyCatalogFilters, filterCatalog, filtersFromSearchParams, filtersToSearchParams } from './catalogFilters';

describe('catalog filters', () => {
  it('round-trips supported filters through URLSearchParams', () => {
    const params = filtersToSearchParams({ ...emptyCatalogFilters, query: 'ansiedad', category: 'anxiety_stress', language: 'es', payload: 'unavailable', duration: 'short' });
    expect(filtersFromSearchParams(params)).toEqual({ ...emptyCatalogFilters, query: 'ansiedad', category: 'anxiety_stress', language: 'es', payload: 'unavailable', duration: 'short' });
  });

  it('combines catalog category, availability, language and question filters', () => {
    const matches = filterCatalog(testsCatalog, { ...emptyCatalogFilters, category: 'anxiety_stress', language: 'es', payload: 'available', questions: 'brief' });
    expect(matches.map((instrument) => instrument.id)).toEqual(['stress-check-v1']);
  });

  it('does not treat unknown URL values as active filters', () => {
    const filters = filtersFromSearchParams(new URLSearchParams('category=unknown&language=xx&payload=hidden'));
    expect(filters).toEqual(emptyCatalogFilters);
  });
});
