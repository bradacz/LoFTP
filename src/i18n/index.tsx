import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { languages, messages, type Locale, type Messages } from "./messages";

const STORAGE_KEY = "loftp-language";
const DEFAULT_LOCALE: Locale = "en";
const RTL_LOCALES = new Set<Locale>();

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  languages: typeof languages;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function formatTemplate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

function resolvePath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && stored in messages) return stored as Locale;

  const systemCandidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  for (const candidate of systemCandidates) {
    const exact = candidate as Locale;
    if (exact in messages) return exact;

    const base = candidate.split("-")[0] as Locale;
    if (base in messages) return base;
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const activeMessages = useMemo(() => messages[locale], [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const value = resolvePath(activeMessages, key) ?? resolvePath(messages[DEFAULT_LOCALE], key);
    if (typeof value !== "string") return key;
    return formatTemplate(value, params);
  }, [activeMessages]);

  const value = useMemo(
    () => ({ locale, setLocale, languages, messages: activeMessages, t }),
    [activeMessages, locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}

export type { Locale, Messages };
