"use client";

import { useLocale } from "@/context/LocaleContext";
import type {
  DisplaySettings,
  GameLevel,
  GameTier,
} from "@/lib/phrase-game/types";

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
    onSettingsChange({ ...settings, ...patch });
  }

  return (
    <div className="space-y-8">
      {/* Language tier */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.tierLabel")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIERS.map(({ id, enabled }) => {
            const active = tier === id;
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
                {!enabled ? (
                  <span className="mt-1 block text-[0.6rem] uppercase tracking-wide text-ink/40">
                    {t("phraseGame.soonBadge")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Game level */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("phraseGame.levelLabel")}</legend>
        <div className="space-y-2">
          {LEVELS.map((lv) => {
            const disabled = iniciante && lv > 2;
            const active = level === lv;
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
                <span className="text-sm text-ink/80">{t(`phraseGame.level.${lv}`)}</span>
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
            label={t("phraseGame.extra.hanziOnly")}
            checked={settings.hanziOnly}
            onChange={(v) =>
              setDisplay({ hanziOnly: v, ...(v ? { hanziPlusPinyin: false } : {}) })
            }
          />
          <Checkbox
            label={t("phraseGame.extra.addExtra")}
            checked={settings.addExtraHanzi}
            onChange={(v) => setDisplay({ addExtraHanzi: v })}
          />
          <Checkbox
            label={t("phraseGame.extra.pinyinDifficult")}
            checked={settings.pinyinDifficult}
            onChange={(v) => setDisplay({ pinyinDifficult: v })}
          />
          <Checkbox
            label={t("phraseGame.extra.hanziPinyin")}
            checked={settings.hanziPlusPinyin}
            onChange={(v) =>
              setDisplay({ hanziPlusPinyin: v, ...(v ? { hanziOnly: false } : {}) })
            }
          />
          <Checkbox
            label={t("phraseGame.extra.translationDifficult")}
            checked={settings.translationDifficult}
            onChange={(v) => setDisplay({ translationDifficult: v })}
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
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink/30 accent-accent"
      />
      {label}
    </label>
  );
}
