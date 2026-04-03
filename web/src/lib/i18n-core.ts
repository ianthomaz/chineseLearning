export type AppLocale = "pt" | "en" | "es";

export type MessageDict = Record<string, unknown>;

function getByPath(dict: MessageDict, path: string): unknown {
  const keys = path.split(".");
  let cur: unknown = dict;
  for (const k of keys) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function createTranslator(dict: MessageDict) {
  return function t(
    path: string,
    vars?: Record<string, string | number>,
  ): string {
    const raw = getByPath(dict, path);
    if (typeof raw !== "string") return path;
    return interpolate(raw, vars);
  };
}
