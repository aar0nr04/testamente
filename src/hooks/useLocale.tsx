import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import es from '../locales/es.json'; import en from '../locales/en.json';
import type { LocaleCode } from '../types/domain';
type Dictionary = Record<string, string>; const spanish = es as Dictionary; const english = en as Dictionary;
const dictionaries: Record<LocaleCode, Dictionary> = { es: spanish, en: english, fr: spanish, pt: spanish, it: spanish, de: spanish, zh: spanish };
interface LocaleContextValue { locale: LocaleCode; setLocale: (locale: LocaleCode) => void; t: (key: string) => string; }
const Context = createContext<LocaleContextValue | undefined>(undefined); const KEY = 'testamente:locale'; const supported: LocaleCode[] = ['es', 'en', 'fr', 'pt', 'it', 'de', 'zh'];
function initialLocale(): LocaleCode { const saved = localStorage.getItem(KEY) as LocaleCode | null; if (saved && supported.includes(saved)) return saved; const browser = navigator.language.slice(0, 2) as LocaleCode; return supported.includes(browser) ? browser : 'es'; }
export function LocaleProvider({ children }: { children: ReactNode }) { const [locale, setLocaleState] = useState<LocaleCode>(initialLocale); useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = 'ltr'; }, [locale]); const value = useMemo(() => ({ locale, setLocale(next: LocaleCode) { localStorage.setItem(KEY, next); setLocaleState(next); }, t(key: string) { return dictionaries[locale][key] ?? spanish[key] ?? english[key] ?? key; } }), [locale]); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useLocale() { const value = useContext(Context); if (!value) throw new Error('useLocale debe usarse dentro de LocaleProvider.'); return value; }
