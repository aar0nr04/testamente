import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import en from '../locales/en.json';
import es from '../locales/es.json';
import type { LocaleCode } from '../types/test';

type Dictionary = Record<string, string>;

const dictionaries: Record<LocaleCode, Dictionary> = { en, es };

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY = 'testamente:locale';

function getInitialLocale(): LocaleCode {
  const savedLocale = localStorage.getItem(STORAGE_KEY);
  return savedLocale === 'es' ? 'es' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(getInitialLocale);

  const value = useMemo<LocaleContextValue>(() => {
    const setLocale = (nextLocale: LocaleCode) => {
      localStorage.setItem(STORAGE_KEY, nextLocale);
      setLocaleState(nextLocale);
    };

    const t = (key: string): string => dictionaries[locale][key] ?? key;

    return {
      locale,
      setLocale,
      t,
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);

  if (!value) {
    throw new Error('useLocale must be used inside LocaleProvider.');
  }

  return value;
}
