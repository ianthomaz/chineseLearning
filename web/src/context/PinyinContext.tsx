"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "chineseLearning:showPinyin";

type PinyinContextValue = {
  showPinyin: boolean;
  setShowPinyin: (value: boolean) => void;
  togglePinyin: () => void;
};

const PinyinContext = createContext<PinyinContextValue | null>(null);

export function PinyinProvider({ children }: { children: React.ReactNode }) {
  const [showPinyin, setShowPinyinState] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "0") setShowPinyinState(false);
    } catch {
      /* ignore */
    }
  }, []);

  const setShowPinyin = useCallback((value: boolean) => {
    setShowPinyinState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const togglePinyin = useCallback(() => {
    setShowPinyinState((prev) => {
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
    () => ({ showPinyin, setShowPinyin, togglePinyin }),
    [showPinyin, setShowPinyin, togglePinyin],
  );

  return (
    <PinyinContext.Provider value={value}>{children}</PinyinContext.Provider>
  );
}

export function usePinyin(): PinyinContextValue {
  const ctx = useContext(PinyinContext);
  if (!ctx) {
    throw new Error("usePinyin must be used within PinyinProvider");
  }
  return ctx;
}
