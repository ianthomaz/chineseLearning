import type { Metadata } from "next";
import { Suspense } from "react";
import { RandomHanziAutostartGate } from "@/components/RandomHanziAutostartGate";
import { blocks } from "@/lib/blocks";

export const metadata: Metadata = {
  title: "Escrita hanzi",
  description:
    "Sessão de escrita com caracteres sorteados a partir do vocabulário do curso.",
};

export default function RandomHanziPage() {
  return (
    <Suspense fallback={null}>
      <RandomHanziAutostartGate blocks={blocks} />
    </Suspense>
  );
}
