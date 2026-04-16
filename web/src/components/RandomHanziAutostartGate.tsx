"use client";

import { useSearchParams } from "next/navigation";
import { RandomHanziClient } from "@/components/RandomHanziClient";
import type { ContentBlock } from "@/lib/blocks";

export function RandomHanziAutostartGate({ blocks }: { blocks: ContentBlock[] }) {
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("autostart") === "1";
  return <RandomHanziClient blocks={blocks} autoStartSession={autoStart} />;
}
