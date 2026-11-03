/**
 * Email sanity checks shared by the sign-up form and the server — and ported
 * 1:1 to the iOS app (`Shared/Account/EmailCheck.swift`). Keep them in step.
 *
 * Not a validator of deliverability: it catches the typos people actually make
 * on the provider part ("hotmal.com", "gmail.com.br", "google.com") and offers a
 * correction. The confirmation link is what proves the address.
 */

/** Providers and the endings they really use. `gmail.com.br` does not exist. */
const PROVIDERS: Record<string, readonly string[]> = {
  gmail: ["com"],
  googlemail: ["com"],
  hotmail: ["com", "com.br", "es", "fr", "it", "de", "co.uk", "com.ar", "com.mx"],
  outlook: ["com", "com.br", "es", "fr", "pt", "it", "de", "com.ar", "com.mx"],
  live: ["com", "com.br", "fr", "it", "co.uk", "com.ar", "com.mx"],
  yahoo: ["com", "com.br", "es", "fr", "it", "de", "co.uk", "com.ar", "com.mx", "co.jp"],
  icloud: ["com"],
  me: ["com"],
  mac: ["com"],
  msn: ["com"],
  aol: ["com"],
  proton: ["me"],
  protonmail: ["com"],
  qq: ["com"],
  "163": ["com"],
  "126": ["com"],
  sina: ["com", "cn"],
  foxmail: ["com"],
  yeah: ["net"],
  bol: ["com.br"],
  uol: ["com.br"],
  terra: ["com.br"],
  ig: ["com.br"],
  globo: ["com"],
  gmx: ["com", "de", "net"],
};

/** Whole domains that are a known mistake for another one. */
const DOMAIN_FIXES: Record<string, string> = {
  "google.com": "gmail.com",
  "google.com.br": "gmail.com",
  "gmail.com.br": "gmail.com",
  "gmai.com.br": "gmail.com",
  "icloud.com.br": "icloud.com",
};

/** Endings that are typos of `.com` / `.com.br`. */
const TLD_FIXES: Record<string, string> = {
  con: "com",
  cmo: "com",
  ocm: "com",
  vom: "com",
  xom: "com",
  cpm: "com",
  comm: "com",
  "con.br": "com.br",
  "cmo.br": "com.br",
  "combr": "com.br",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Shape only: something@domain.tld, no spaces. */
export function isPlausibleEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  if (email.length > 254 || !EMAIL_RE.test(email)) return false;
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return !domain.startsWith(".") && !domain.endsWith(".") && !domain.includes("..");
}

/** Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) d[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** How far a typed provider name may be from the real one. */
function allowedDistance(provider: string): number {
  if (provider.length <= 3) return 0;
  if (provider.length <= 5) return 1;
  return 2;
}

function closestProvider(label: string): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const provider of Object.keys(PROVIDERS)) {
    const distance = editDistance(label, provider);
    if (distance <= allowedDistance(provider) && distance < bestDistance) {
      best = provider;
      bestDistance = distance;
    }
  }
  return best;
}

function closestEnding(ending: string, allowed: readonly string[]): string {
  const fixed = TLD_FIXES[ending];
  if (fixed && allowed.includes(fixed)) return fixed;
  let best = allowed[0];
  let bestDistance = Infinity;
  for (const candidate of allowed) {
    const distance = editDistance(ending, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return bestDistance <= 2 ? best : allowed[0];
}

/**
 * The corrected domain when the typed one looks like a typo of a common
 * provider ("hotmal.com" → "hotmail.com"), or null when it looks fine.
 */
export function suggestEmailDomain(domainRaw: string): string | null {
  const domain = domainRaw.trim().toLowerCase();
  if (!domain.includes(".")) return null;
  if (DOMAIN_FIXES[domain]) return DOMAIN_FIXES[domain];

  const dot = domain.indexOf(".");
  const label = domain.slice(0, dot);
  const ending = domain.slice(dot + 1);

  const provider = closestProvider(label);
  if (provider) {
    const allowed = PROVIDERS[provider];
    if (provider === label && allowed.includes(ending)) return null;
    const suggestion = `${provider}.${allowed.includes(ending) ? ending : closestEnding(ending, allowed)}`;
    const fixed = DOMAIN_FIXES[suggestion] ?? suggestion;
    return fixed === domain ? null : fixed;
  }

  const tldFix = TLD_FIXES[ending];
  return tldFix ? `${label}.${tldFix}` : null;
}

/** Full address with the suggested domain, or null. */
export function suggestEmail(raw: string): string | null {
  const email = normalizeEmail(raw);
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  const domain = suggestEmailDomain(email.slice(at + 1));
  return domain ? `${email.slice(0, at)}@${domain}` : null;
}
