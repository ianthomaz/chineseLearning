"use client";

import { useLocale } from "@/context/LocaleContext";
import {
  GAME_PRESETS,
  matchPreset,
  type GamePreset,
  type PresetId,
} from "@/lib/phrase-game/presets";
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
  onPresetChange: (preset: GamePreset) => void;
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
  onPresetChange,
  onTierChange,
  onLevelChange,
  onSettingsChange,
  onPlay,
}: Props) {
  const { t } = useLocale();
  const iniciante = tier === "iniciante";
  const activePreset: PresetId | null = matchPreset(tier, level, settings);

  function setDisplay(patch: Partial<DisplaySettings>) {
    onSettingsChange(normalizeDisplay({ ...settings, ...patch }));
  }

  function setHint(
    key: keyof Pick<
      DisplaySettings,
      "pinyinDifficult" | "hanziPlusPinyin" | "translationDifficult"
    >,
    enabled: boolean,
  ) {
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
  /** Shown instead of greying a control out with no explanation. */
  const byLevel = t("phraseGame.hintOffByLevel", { level });
  /** At higher levels every hint is off; say it once instead of four times. */
  const allHintsOff = pinyinHintsOff && translationHintOff && nativePromptOff;
  const perHintReason = allHintsOff ? undefined : byLevel;

  return (
    <div className="space-y-8">
      {/* One decision instead of eight. */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">
          {t("phraseGame.presetLabel")}
        </legend>
        <div className="grid gap-2.5">
          {GAME_PRESETS.map((p) => {
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p)}
                aria-pressed={active}
                className="flex min-h-[64px] items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors"
                style={{
                  borderColor: active ? p.color : "var(--border)",
                  backgroundColor: active
                    ? `color-mix(in srgb, ${p.color} 10%, transparent)`
                    : "transparent",
                  boxShadow: active ? `inset 0 0 0 1px ${p.color}` : undefined,
                }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-hanzi text-xl font-bold"
                  style={{ backgroundColor: p.color, color: "var(--on-category)" }}
                  aria-hidden
                >
                  {p.hanzi}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-base font-semibold text-ink"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {t(`phraseGame.preset.${p.id}.name`)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink/55">
                    {t(`phraseGame.preset.${p.id}.desc`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {activePreset === null ? (
          <p
            className="mt-2 text-xs text-ink/45"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("phraseGame.presetCustom")}
          </p>
        ) : null}
      </fieldset>

      <details className="rounded-xl border px-4" style={{ borderColor: "var(--border)" }}>
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
          {t("phraseGame.customize")}
          <span
            className="shrink-0 text-xs font-normal text-ink/40"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("phraseGame.customizeHint")}
          </span>
        </summary>

        <div className="space-y-7 pb-5 pt-2">
          {/* Vocabulary pool — not a difficulty setting, despite the old name. */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">
              {t("phraseGame.tierLabel")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {PLAYABLE_TIERS.map((id) => {
                const active = tier === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTierChange(id)}
                    className={`min-h-[48px] rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      active ? "font-medium text-white" : "text-ink/70 hover:bg-ink/5"
                    }`}
                    style={{
                      borderColor: active ? "var(--accent)" : "var(--border)",
                      backgroundColor: active ? "var(--accent)" : "transparent",
                    }}
                  >
                    {t(`phraseGame.tier.${id}`)}
                    <span className="mt-0.5 block text-[0.65rem] font-normal opacity-75">
                      {t(`phraseGame.tierDesc.${id}`)}
                    </span>
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
            <legend className="mb-2 text-sm font-semibold text-ink">
              {t("phraseGame.levelLabel")}
            </legend>
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
            {iniciante ? (
              <p className="mt-2 text-xs text-ink/40" style={{ fontFamily: "var(--font-sans)" }}>
                {t("phraseGame.inicianteCap")}
              </p>
            ) : null}
          </fieldset>

          {/* Hints — these make the round EASIER. */}
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-ink">
              {t("phraseGame.helpsLabel")}
            </legend>
            <p className="mb-3 text-xs leading-relaxed text-ink/45">
              {allHintsOff ? t("phraseGame.helpsAllOff", { level }) : t("phraseGame.helpsHint")}
            </p>
            <div className="space-y-1">
              <Checkbox
                label={t("phraseGame.extra.pinyinDifficult")}
                checked={settings.pinyinDifficult}
                disabled={pinyinHintsOff}
                reason={perHintReason}
                onChange={(v) => setHint("pinyinDifficult", v)}
              />
              <Checkbox
                label={t("phraseGame.extra.hanziPinyin")}
                checked={settings.hanziPlusPinyin}
                disabled={pinyinHintsOff}
                reason={perHintReason}
                onChange={(v) => setHint("hanziPlusPinyin", v)}
              />
              <Checkbox
                label={t("phraseGame.extra.translationDifficult")}
                checked={settings.translationDifficult}
                disabled={translationHintOff}
                reason={perHintReason}
                onChange={(v) => setHint("translationDifficult", v)}
              />
              <Checkbox
                label={t("phraseGame.extra.showNativePrompt")}
                checked={settings.showNativePrompt}
                disabled={nativePromptOff}
                reason={perHintReason}
                onChange={(v) => setDisplay({ showNativePrompt: v })}
              />
            </div>
          </fieldset>

          {/* The one setting that makes the round HARDER. */}
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-ink">
              {t("phraseGame.harderLabel")}
            </legend>
            <p className="mb-3 text-xs leading-relaxed text-ink/45">
              {t("phraseGame.harderHint")}
            </p>
            <Checkbox
              label={t("phraseGame.extra.addExtra")}
              checked={settings.addExtraHanzi}
              disabled={level >= 4}
              reason={t("phraseGame.alwaysOnByLevel", { level })}
              onChange={(v) => setDisplay({ addExtraHanzi: v })}
            />
          </fieldset>
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
  reason,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  /** Why the control is unavailable — shown instead of an unexplained grey box. */
  reason?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex min-h-[44px] items-start gap-3 py-1 text-sm ${
        disabled ? "cursor-not-allowed text-ink/35" : "cursor-pointer text-ink/80"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-ink/30 accent-accent disabled:opacity-40"
      />
      <span className="min-w-0">
        {label}
        {disabled && reason ? (
          <span
            className="mt-0.5 block text-xs text-ink/35"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {reason}
          </span>
        ) : null}
      </span>
    </label>
  );
}
