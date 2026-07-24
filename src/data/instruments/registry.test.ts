import { describe, expect, it } from 'vitest';
import { gad7Content } from './content/gad7';
import { phq9Content } from './content/phq9';
import { gad7Algorithm, phq9Algorithm } from './algorithms';
import { instrumentRegistry } from './registry';
import { scoreInstrument } from '../../engine/instrumentEngine';

describe('instrument registry', () => {
  it('contains the twenty public backlog instruments plus private AMAS-A with explicit locale states', () => {
    expect(instrumentRegistry).toHaveLength(21);
    expect(new Set(instrumentRegistry.map((instrument) => instrument.id)).size).toBe(21);
    for (const instrument of instrumentRegistry) {
      expect(Object.keys(instrument.localeStatus).sort()).toEqual(['de', 'en', 'es', 'fr', 'it', 'pt', 'zh']);
      expect(instrument.featureFlag).toMatch(/^VITE_/);
    }
    expect(instrumentRegistry.find((instrument) => instrument.id === 'amas-a')).toMatchObject({ accessMode: 'review_private', published: false, scoringStatus: 'pending_reference_data' });
  });

  it('keeps identifiers and numeric results stable across all GAD-7 and PHQ-9 locales', () => {
    const gadAnswers = Object.fromEntries(gad7Algorithm.items.map((item, index) => [item.id, `${index % 4}`]));
    const phqAnswers = Object.fromEntries(phq9Algorithm.items.map((item, index) => [item.id, `${index % 4}`]));
    const gadIds = gad7Content.en.questions.map((question) => question.id);
    const phqIds = phq9Content.en.questions.map((question) => question.id);
    for (const content of Object.values(gad7Content)) { expect(content.questions.map((question) => question.id)).toEqual(gadIds); expect(scoreInstrument(gad7Algorithm, gadAnswers).total).toBe(9); }
    for (const content of Object.values(phq9Content)) { expect(content.questions.map((question) => question.id)).toEqual(phqIds); expect(scoreInstrument(phq9Algorithm, phqAnswers).total).toBe(12); }
  });
});
