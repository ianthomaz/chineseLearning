import { MaterialIcon } from "./MaterialIcon";

/** In-round help control with a Material icon + short label. */
export function HelpIconButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-ink/65 transition-colors hover:bg-ink/5"
      style={{ borderColor: "var(--border)", fontFamily: "var(--font-sans)" }}
    >
      <MaterialIcon name={icon} className="text-[1.125rem]" />
      <span>{label}</span>
    </button>
  );
}
