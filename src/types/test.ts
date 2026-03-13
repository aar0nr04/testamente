export type LocaleCode = 'en' | 'es';

export interface TestOption {
  id: string;
  labelKey: string;
  score: number;
}

export interface TestQuestion {
  id: string;
  promptKey: string;
  options: TestOption[];
}

export interface TestResultBand {
  id: string;
  minInclusive: number;
  maxInclusive: number;
  labelKey: string;
  adviceKey: string;
}

export interface PsychologicalTest {
  id: string;
  titleKey: string;
  descriptionKey: string;
  estimatedMinutes: number;
  questions: TestQuestion[];
  resultBands: TestResultBand[];
}

export interface TestRunResult {
  id: string;
  testId: string;
  totalScore: number;
  bandId: string;
  completedAt: string;
}
