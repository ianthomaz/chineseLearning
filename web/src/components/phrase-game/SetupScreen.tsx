"use client";

import { useLocale } from "@/context/LocaleContext";
import { ALL_PHRASES } from "@/lib/phrase-game/phrases";
import { phrasePoolSize, tierPhraseTotal } from "@/lib/phrase-game/select-phrases";
import type {
  DisplaySettings,
  GameLevel,
  GameTier,
} from "@/lib/phrase-game/types";
import {
  nativePromptDisabled,
  pieceHintsDisabled,
} from "@/lib/phrase-game/settings-by-level";

type Props = {
  tier: GameTier;
  level: GameLevel;
  settings: DisplaySettings;
  onTierChange: (tier: GameTier) => void;
  onLevelChange: (level: GameLevel) => void;
  onSettingsChange: (settings: DisplaySettings) => void;
  onPlay: () => void;
};

const TIERS: Array<{ id: GameTier; enabled: boolean }> = [
  { id: "iniciante", enabled: true },
  { id: "basico", enabled: true },
  { id: "intermediario", enabled: false },
  { id: "avancado", enabled: false },
];

const LEVELS: GameLevel[] = [1, 2, 3, 4, 5];

export function SetupScreen({
  tier,
  level,
  settings,
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

  const pieceHintsOff = pieceHintsDisabled(level);
  const nativePromptOff = nativePromptDisabled(level);
  const basico = tier === "basico";

  return (
    <div className="space-y-8">
      {/* Language tier */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.tierLabel")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIERS.map(({ id, enabled }) => {
            const active = tier === id;
            const tierCount =
              enabled && (id === "iniciante" || id === "basico")
                ? tierPhraseTotal(ALL_PHRASES, id)
                : null;
            return (
              <button
                key={id}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && onTierChange(id)}
                className={`relative rounded-xl border px-3 py-3 text-sm transition-colors ${
                  active ? "font-medium text-white" : "text-ink/70 hover:bg-ink/5"
                } ${!enabled ? "cursor-not-allowed opacity-50" : ""}`}
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  backgroundColor: active ? "var(--accent)" : "transparent",
                }}
              >
                {t(`phraseGame.tier.${id}`)}
                {tierCount !== null ? (
                  <span
                    className={`mt-1 block text-[0.65rem] ${active ? "text-white/85" : "text-ink/45"}`}
                  >
                    {t("phraseGame.tierPhraseCount", { count: tierCount })}
                  </span>
                ) : null}
                {!enabled ? (
                  <span className="mt-1 block text-[0.6rem] uppercase tracking-wide text-ink/40">
                    {t("phraseGame.soonBadge")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {basico ? (
          <p className="mt-2 text-xs text-ink/55">{t("phraseGame.basicoFullAccess")}</p>
        ) : null}
      </fieldset>

      {/* Game level */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.levelLabel")}</legend>
        <div className="space-y-2">
          {LEVELS.map((lv) => {
            const disabled = iniciante && lv > 2;
            const active = level === lv;
            const poolSize = disabled ? null : phrasePoolSize(ALL_PHRASES, tier, lv);
            return (
              <button
                key={lv}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onLevelChange(lv)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  active ? "" : "hover:bg-ink/5"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
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
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink/80">{t(`phraseGame.level.${lv}`)}</span>
                  {poolSize !== null ? (
                    <span className="block text-xs text-ink/45">
                      {t("phraseGame.levelPoolCount", { count: poolSize })}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        {iniciante ? (
          <p className="mt-2 text-xs text-ink/45">{t("phraseGame.inicianteCap")}</p>
        ) : null}
      </fieldset>

      {/* Difficulty extras */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.extrasLabel")}</legend>
        <div className="space-y-2.5">
          <Checkbox
            label={t("phraseGame.extra.pinyinDifficult")}
            checked={settings.pinyinDifficult}
            disabled={pieceHintsOff}
            onChange={(v) => setHint("pinyinDifficult", v)}
          />
          <Checkbox
            label={t("phraseGame.extra.hanziPinyin")}
            checked={settings.hanziPlusPinyin}
            disabled={pieceHintsOff}
            onChange={(v) => setHint("hanziPlusPinyin", v)}
          />
          <Checkbox
            label={t("phraseGame.extra.translationDifficult")}
            checked={settings.translationDifficult}
            disabled={pieceHintsOff}
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
      </fieldset>

      <button
        type="button"
        onClick={onPlay}
        className="w-full rounded-2xl px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {t("phraseGame.play")}
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
      className={`flex items-center gap-3 text-sm ${
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
