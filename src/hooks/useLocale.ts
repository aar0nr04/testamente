import { useMemo, useState } from 'react';
import en from '../locales/en.json';
import es from '../locales/es.json';
import type { LocaleCode } from '../types/test';

type Dictionary = Record<string, string>;

const dictionaries: Record<LocaleCode, Dictionary> = { en, es };

export function useLocale() {
  const [locale, setLocale] = useState<LocaleCode>('en');

  const t = useMemo(
    () => (key: string): string => {
      const value = dictionaries[locale][key];
      return value ?? key;
    },
    [locale]
  );

  return { locale, setLocale, t };
}
