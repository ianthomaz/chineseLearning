"use client";

import { PinyinProvider } from "@/context/PinyinContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PinyinProvider>{children}</PinyinProvider>;
}
