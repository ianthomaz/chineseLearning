import { MaterialIcon } from "./MaterialIcon";

/** In-round help control with a Material icon + short label. */
export function HelpIconButton({
  icon,
  label,
  onClick,
  pressed = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  /** Active / “on” state (e.g. pinyin currently visible → hide). */
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-xs text-ink/65 transition-colors hover:bg-ink/5"
      style={{
        borderColor: pressed ? "var(--accent)" : "var(--border)",
        backgroundColor: pressed ? "rgba(45,90,140,0.08)" : "transparent",
        color: pressed ? "var(--accent)" : undefined,
        fontFamily: "var(--font-sans)",
      }}
    >
      <MaterialIcon name={icon} className="text-[1.125rem]" />
      <span>{label}</span>
    </button>
  );
}
