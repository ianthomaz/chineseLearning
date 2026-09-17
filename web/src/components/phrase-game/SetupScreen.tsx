"use client";

import { useLocale } from "@/context/LocaleContext";
import type {
  DisplaySettings,
  GameLevel,
  GameTier,
} from "@/lib/phrase-game/types";
import {
  nativePromptDisabled,
  pinyinHintsDisabled,
  translationDifficultDisabled,
} from "@/lib/phrase-game/settings-by-level";

type Props = {
  tier: GameTier;
  level: GameLevel;
  settings: DisplaySettings;
  /** Bank still in flight — the round cannot be built yet. */
  bankLoading: boolean;
  onTierChange: (tier: GameTier) => void;
  onLevelChange: (level: GameLevel) => void;
  onSettingsChange: (settings: DisplaySettings) => void;
  onPlay: () => void;
};

const PLAYABLE_TIERS: GameTier[] = ["iniciante", "basico"];

/** Not in the bank yet — announced as a line of text, not as disabled buttons. */
const UPCOMING_TIERS: GameTier[] = ["intermediario", "avancado"];

const LEVELS: GameLevel[] = [1, 2, 3, 4, 5];

export function SetupScreen({
  tier,
  level,
  settings,
  bankLoading,
  onTierChange,
  onLevelChange,
  onSettingsChange,
  onPlay,
}: Props) {
  const { t } = useLocale();
  const iniciante = tier === "iniciante";

  function setDisplay(patch: Partial<DisplaySettings>) {
    onSettingsChange(normalizeDisplay({ ...settings, ...patch }));
  }

  function setHint(key: keyof Pick<DisplaySettings, "pinyinDifficult" | "hanziPlusPinyin" | "translationDifficult">, enabled: boolean) {
    const next = { ...settings, [key]: enabled };
    if (enabled) next.hanziOnly = false;
    setDisplay(next);
  }

  function normalizeDisplay(s: DisplaySettings): DisplaySettings {
    const anyPieceHint = s.hanziPlusPinyin || s.pinyinDifficult || s.translationDifficult;
    return { ...s, hanziOnly: !anyPieceHint };
  }

  const pinyinHintsOff = pinyinHintsDisabled(level);
  const translationHintOff = translationDifficultDisabled(level);
  const nativePromptOff = nativePromptDisabled(level);

  return (
    <div className="space-y-8">
      {/* Language tier */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.tierLabel")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {PLAYABLE_TIERS.map((id) => {
            const active = tier === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTierChange(id)}
                className={`min-h-[48px] rounded-xl border px-3 py-3 text-sm transition-colors ${
                  active ? "font-medium text-white" : "text-ink/70 hover:bg-ink/5"
                }`}
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  backgroundColor: active ? "var(--accent)" : "transparent",
                }}
              >
                {t(`phraseGame.tier.${id}`)}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink/40" style={{ fontFamily: "var(--font-sans)" }}>
          {t("phraseGame.tierSoon", {
            tiers: UPCOMING_TIERS.map((id) => t(`phraseGame.tier.${id}`)).join(" · "),
          })}
        </p>
      </fieldset>

      {/* Game level */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.levelLabel")}</legend>
        <div className="space-y-2">
          {LEVELS.filter((lv) => !iniciante || lv <= 2).map((lv) => {
            const active = level === lv;
            return (
              <button
                key={lv}
                type="button"
                onClick={() => onLevelChange(lv)}
                className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  active ? "" : "hover:bg-ink/5"
                }`}
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  backgroundColor: active ? "rgba(45,90,140,0.06)" : "transparent",
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    color: active ? "var(--accent)" : "var(--ink)",
                  }}
                >
                  {lv}
                </span>
                <span className="text-sm text-ink/80">{t(`phraseGame.level.${lv}`)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Difficulty extras */}
      <details className="rounded-xl border px-4" style={{ borderColor: "var(--border)" }}>
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
          {t("phraseGame.extrasLabel")}
          <span className="text-xs font-normal text-ink/40" style={{ fontFamily: "var(--font-sans)" }}>
            {t("phraseGame.extrasOptional")}
          </span>
        </summary>
        <div className="space-y-2.5 pb-4 pt-1">
          <Checkbox
            label={t("phraseGame.extra.pinyinDifficult")}
            checked={settings.pinyinDifficult}
            disabled={pinyinHintsOff}
            onChange={(v) => setHint("pinyinDifficult", v)}
          />
          <Checkbox
            label={t("phraseGame.extra.hanziPinyin")}
            checked={settings.hanziPlusPinyin}
            disabled={pinyinHintsOff}
            onChange={(v) => setHint("hanziPlusPinyin", v)}
          />
          <Checkbox
            label={t("phraseGame.extra.translationDifficult")}
            checked={settings.translationDifficult}
            disabled={translationHintOff}
            onChange={(v) => setHint("translationDifficult", v)}
          />
          <Checkbox
            label={t("phraseGame.extra.showNativePrompt")}
            checked={settings.showNativePrompt}
            disabled={nativePromptOff}
            onChange={(v) => setDisplay({ showNativePrompt: v })}
          />
          <Checkbox
            label={t("phraseGame.extra.addExtra")}
            checked={settings.addExtraHanzi}
            onChange={(v) => setDisplay({ addExtraHanzi: v })}
          />
        </div>
      </details>

      <button
        type="button"
        onClick={onPlay}
        disabled={bankLoading}
        className="w-full rounded-2xl px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {bankLoading ? t("phraseGame.bankLoading") : t("phraseGame.play")}
      </button>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex min-h-[44px] items-center gap-3 text-sm ${
        disabled ? "cursor-not-allowed text-ink/35" : "cursor-pointer text-ink/80"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink/30 accent-accent disabled:opacity-40"
      />
      {label}
    </label>
  );
}
