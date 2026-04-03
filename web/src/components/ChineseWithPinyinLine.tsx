"use client";

import { usePinyin } from "@/context/PinyinContext";

type Props = {
  hanzi: string;
  /** Used for a11y and hover hint; phrase display uses the Hanzi Pinyin webfont. */
  pinyin: string;
  hanziClassName?: string;
};

const defaultRuby =
  "font-ruby text-2xl leading-loose text-ink md:text-[1.7rem]";
const defaultHanzi =
  "font-hanzi text-2xl leading-loose text-ink md:text-[1.7rem]";

export function ChineseWithPinyinLine({
  hanzi,
  pinyin,
  hanziClassName,
}: Props) {
  const { showPinyin } = usePinyin();

  const rubyClass = hanziClassName
    ? hanziClassName.replace(/\bfont-hanzi\b/g, "font-ruby")
    : defaultRuby;
  const plainClass = hanziClassName ?? defaultHanzi;

  return (
    <p
      className={showPinyin ? rubyClass : plainClass}
      {...(showPinyin && pinyin
        ? {
            title: pinyin,
            "aria-label": `${hanzi} (${pinyin})`,
          }
        : {})}
    >
      {hanzi}
    </p>
  );
}
