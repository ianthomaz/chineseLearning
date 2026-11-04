/**
 * NOIA clearance — port of `ianthomaz/025_noiaShell` `server/noia.js`
 * (canonical spec: publicNOIA/noia/SPEC.md). Do not diverge from it.
 *
 * A UC (user clearance) is a type letter plus a level digit: N (visitor) <
 * O (outsider) < I (insider) < A (admin), level 0–9, e.g. "O4". Deny-by-default:
 * an invalid UC never passes.
 */

export const TYPE_ORDER = ["N", "O", "I", "A"] as const;
export type ClearanceType = (typeof TYPE_ORDER)[number];

const UC_RE = /^([NOIA])([0-9])$/;

/**
 * Clearances this site assigns (levels are per project in NOIA). Change here,
 * nowhere else: N0 no account · O1 email+password, unconfirmed · O4 confirmed
 * (Google/Apple/Alipay sign-in or opened confirmation link).
 */
export const CLEARANCE = {
  /** No session. */
  visitor: "N0",
  /** Email + password given, email not confirmed yet. */
  pending: "O1",
  /** Account released: confirmed email, or Google / Apple / Alipay sign-in. */
  released: "O4",
} as const;

/** "Has a released account": outsider O4 or above, or any insider / admin. */
export const RELEASED_RULE = "O4|I0|A0";

export function isValid(uc: unknown): uc is string {
  return typeof uc === "string" && UC_RE.test(uc.trim().toUpperCase());
}

export function parse(uc: unknown): { type: ClearanceType; level: number } | null {
  if (typeof uc !== "string") return null;
  const m = uc.trim().toUpperCase().match(UC_RE);
  if (!m) return null;
  return { type: m[1] as ClearanceType, level: Number(m[2]) };
}

export function rank(type: string): number {
  return (TYPE_ORDER as readonly string[]).indexOf(type);
}

function parseTerm(term: string): { type: string; min: number } | null {
  const m = String(term).trim().toUpperCase().match(/^([NOIA])([0-9])?$/);
  if (!m) return null;
  return { type: m[1], min: m[2] === undefined ? 0 : Number(m[2]) };
}

export type ClearanceRule =
  | string
  | { level?: number; min?: number; type?: string; types?: string[]; minType?: string };

/** Does `uc` satisfy `rule`? Same semantics as noia.js `can()`. */
export function can(uc: unknown, rule: ClearanceRule | null | undefined): boolean {
  const u = parse(uc);
  if (!u || rule == null) return false;

  if (typeof rule === "string") {
    const terms = rule
      .split(/[|,]/)
      .map(parseTerm)
      .filter((t): t is { type: string; min: number } => t !== null);
    if (terms.length === 0) return false;
    return terms.some((t) => u.type === t.type && u.level >= t.min);
  }

  if (Number.isInteger(rule.level)) {
    if (u.level !== rule.level) return false;
  } else {
    const min = Number.isInteger(rule.min) ? (rule.min as number) : 0;
    if (u.level < min) return false;
  }
  if (rule.type) return u.type === rule.type;
  if (Array.isArray(rule.types)) return rule.types.includes(u.type);
  if (rule.minType) {
    const need = rank(rule.minType);
    return need >= 0 && rank(u.type) >= need;
  }
  return true;
}

export function isReleased(uc: unknown): boolean {
  return can(uc, RELEASED_RULE);
}
