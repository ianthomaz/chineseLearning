"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppLocale, MessageDict } from "@/lib/i18n-core";
import { createTranslator } from "@/lib/i18n-core";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";

const STORAGE_KEY = "chineseLearning:locale";

const dictionaries: Record<AppLocale, MessageDict> = {
  pt: pt as MessageDict,
  en: en as MessageDict,
  es: es as MessageDict,
};

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): AppLocale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "es" || v === "pt") return v;
  } catch {
    /* ignore */
  }
  return "pt";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("pt");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const dict = dictionaries[locale];
  const t = useMemo(() => createTranslator(dict), [dict]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang =
      locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en";
  }, [locale, ready]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export const locales: AppLocale[] = ["pt", "en", "es"];

export function localeMeta(loc: AppLocale) {
  const d = dictionaries[loc];
  const meta = d.meta as Record<string, string> | undefined;
  return {
    flag: meta?.flag ?? "",
    langName: meta?.langName ?? loc,
  };
}
