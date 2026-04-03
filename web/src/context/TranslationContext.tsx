"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "chineseLearning:showTranslation";

type TranslationContextValue = {
  showTranslation: boolean;
  setShowTranslation: (value: boolean) => void;
  toggleTranslation: () => void;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [showTranslation, setShowTranslationState] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "0") setShowTranslationState(false);
    } catch {
      /* ignore */
    }
  }, []);

  const setShowTranslation = useCallback((value: boolean) => {
    setShowTranslationState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTranslation = useCallback(() => {
    setShowTranslationState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ showTranslation, setShowTranslation, toggleTranslation }),
    [showTranslation, setShowTranslation, toggleTranslation],
  );

  return (
    <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
  );
}

export function useTranslationDisplay(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslationDisplay must be used within TranslationProvider");
  }
  return ctx;
}
