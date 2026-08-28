import type { LocalizedInstrumentContent } from '../types';

const questions = [
  'I feel that I am a person of worth, at least on an equal plane with others.',
  'I feel that I have a number of good qualities.',
  'All in all, I am inclined to feel that I am a failure.',
  'I am able to do things as well as most other people.',
  'I feel I do not have much to be proud of.',
  'I take a positive attitude toward myself.',
  'On the whole, I am satisfied with myself.',
  'I wish I could have more respect for myself.',
  'I certainly feel useless at times.',
  'At times I think I am no good at all.',
];

/** Original English wording from the public-domain Rosenberg Scale source. */
export const rsesContent: Record<'en', LocalizedInstrumentContent> = {
  en: {
    instrumentId: 'rses',
    contentVersion: '2026.08.1',
    locale: 'en',
    title: 'Rosenberg Self-Esteem Scale (RSES)',
    instructions: 'Below is a list of statements dealing with your general feelings about yourself. Please indicate how strongly you agree or disagree with each statement.',
    optionLabels: {
      '0': 'Strongly agree',
      '1': 'Agree',
      '2': 'Disagree',
      '3': 'Strongly disagree',
    },
    questions: questions.map((text, index) => ({ id: `rses${index + 1}`, text })),
  },
};
