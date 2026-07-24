import { httpsCallable } from 'firebase/functions';
import { requireFunctions } from './firebase';
import type { InstrumentAlgorithm, LocalizedInstrumentContent } from '../data/instruments/types';

export interface PrivateReviewPayload {
  instrumentId: string;
  contentVersion: string;
  algorithmVersion: string;
  locale: string;
  content: LocalizedInstrumentContent;
  algorithm: InstrumentAlgorithm;
}

export async function loadPrivateInstrumentPayload(instrumentId: string): Promise<PrivateReviewPayload> {
  const callable = httpsCallable<{ instrumentId: string }, PrivateReviewPayload>(requireFunctions(), 'getPrivateInstrumentPayload');
  return (await callable({ instrumentId })).data;
}
