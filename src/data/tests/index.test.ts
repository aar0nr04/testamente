import { describe, expect, it } from 'vitest';
import { getCatalogForLocale, getReviewTestById, getTestById } from './index';

describe('catalog questionnaire payloads', () => {
  it('keeps unpublished clinical instruments out of public execution but makes reviewed Spanish content available to authorized review', () => {
    const gad7 = getTestById('gad-7', 'es');
    const phq9 = getTestById('phq-9', 'es');

    expect(gad7).toMatchObject({ payloadAvailable: false, reviewAvailable: true, contentLocale: 'es' });
    expect(gad7?.questions).toHaveLength(7);
    expect(gad7?.algorithm?.items).toHaveLength(7);
    expect(phq9).toMatchObject({ payloadAvailable: false, reviewAvailable: true, contentLocale: 'es' });
    expect(phq9?.questions).toHaveLength(9);
    expect(phq9?.algorithm?.items).toHaveLength(9);
    expect(getReviewTestById('gad-7', 'es')?.payloadAvailable).toBe(true);
    expect(gad7?.reviewState).toBe('review_ready');
  });

  it('does not fall back to an unreviewed translation and preserves the public local check-in', () => {
    const frenchGad7 = getTestById('gad-7', 'fr');
    const localStress = getCatalogForLocale('es').find((item) => item.id === 'stress-check-v1');

    expect(frenchGad7?.reviewAvailable).toBeUndefined();
    expect(frenchGad7?.questions).toEqual([]);
    expect(localStress?.payloadAvailable).toBe(true);
    expect(localStress?.algorithm?.items).toHaveLength(4);
    expect(getTestById('bai', 'es')?.reviewState).toBe('material_or_permission_blocked');
    expect(getTestById('stroop', 'es')?.reviewState).toBe('not_implemented');
  });

  it('exposes only the source-backed English RSES payload for authorized review', () => {
    const englishRses = getReviewTestById('rses', 'en');
    const spanishRses = getTestById('rses', 'es');

    expect(englishRses?.questions).toHaveLength(10);
    expect(englishRses?.payloadAvailable).toBe(true);
    expect(spanishRses?.questions).toEqual([]);
  });
});
