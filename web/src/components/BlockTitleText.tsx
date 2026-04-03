"use client";

import { useLocale } from "@/context/LocaleContext";
import { localizedBlockTitle } from "@/lib/block-title";
import type { ContentBlock } from "@/lib/blocks";

type Props = Pick<ContentBlock, "id" | "title">;

export function BlockTitleText({ id, title }: Props) {
  const { t } = useLocale();
  return <>{localizedBlockTitle(id, title, t)}</>;
}
