import stressCheck from './stress-check-v1.json';
import type { PsychologicalTest } from '../../types/test';

export const testsCatalog: PsychologicalTest[] = [stressCheck as PsychologicalTest];

export function getTestById(testId: string): PsychologicalTest | undefined {
  return testsCatalog.find((test) => test.id === testId);
}
