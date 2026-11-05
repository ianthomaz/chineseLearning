# AGENTS.md — chineseLearning

Operational brief for coding agents (Codex, Cursor, etc.).
**Product law lives in [`CLAUDE.md`](CLAUDE.md)** — read it first and do not reopen
decisions marked there (no site search, no unsolicited deploy, pt-BR not pt-PT, …).

## Layout

| Path | Role |
|------|------|
| `web/` | Next.js site — learnchinese.today |
| `appMobile/` | Submodule `APP_learnChineseToday` → `ios/` + `android/` + `docs/` |
| `vocabulario/` | Lexicon / phrase curation sources |
| `docs/` | Project docs (`01`…`10`). Auth: `docs/05_autenticacao.md` |
| `ianthomaz/` | Personal scratch — **out of product**; do not expand |

Do **not** revive `appApple/` paths. iOS work happens under `appMobile/ios/`.

## Hard rules

- **Ask before inventing names** (files, folders, vars, processes, products).
- **Questions (`?`) = investigate / answer.** Do not execute until the owner asks.
- **Minimal diffs.** One concern at a time. Prefer hardening over new fronts.
- **No deploy** (`deploy:*`, `start.sh` prod/upload) unless explicitly asked.
- **No secrets in git:** `ios/Config/Secrets.xcconfig`, `local/credentials/*` real files,
  private keys, tokens. Keep examples only.
- **Clearance / NOIA levels are server-internal.** Never show in UI or put in
  client account payloads. Clients get functional flags only (e.g. `released`).
- **Alipay email is unverified** (`emailVerified=false`). No auto-merge by Alipay email.
  Website APPID ≠ mobile APPID → different `open_id`s; do not “fix” that with unsafe merges.
- Code / comments / identifiers in **English**. UI strings via i18n
  (web: en first, then pt-BR + es; app: String Catalog).
- Do not hand-edit `web/src/data/phrase-game/phrases.json` (generated).
- Do not change `web/prisma/schema.prisma` without updating `docs/07_conteudo_dados.md`.

## Where to look

| Topic | Doc / code |
|-------|------------|
| Tasks board (`chineseLearning`) | `tasks/README.md` · https://tasks.daempresa.com.br/ |
| Auth (Google, Apple, Alipay, email, app token) | `docs/05_autenticacao.md` |
| App login / device checklist | `appMobile/docs/08_login.md` |
| Work order | `docs/09_roadmap_integracoes.md` |
| Alipay server | `web/src/server/auth/alipay.ts`, `web/src/app/api/app/alipay/`, `web/src/app/api/app/auth/` |
| Alipay iOS | `appMobile/ios/Features/Account/AlipaySignInBridge.swift` |
| Account payload | `web/src/server/account/service.ts` → `accountPayload` |
| Stroke order (iOS) | `appMobile/ios/Shared/StrokeOrderDocument.swift`, `Vendor/HanziWriter/`, `Scripts/sync-stroke-data.mjs` |

## Verify before calling done

```bash
# Site
cd web
npx next build
npm run build:webplace
npx eslint src && npx tsc --noEmit
npm run test:identity
# if auth/Alipay touched:
npm run test:alipay

# iOS (from appMobile/ios)
swift test
# UI changes: Xcode → scheme LearnChineseToday → Product → Test (UITests)
```

Measure performance when you change load paths; do not estimate
(`docs/08_produto_observabilidade.md`). Check layouts at **390 pt** width.

## Current focus (update when WIP lands)

WIP largely done locally (not necessarily committed):

1. **Done in tree:** offline stroke order (665 chars + integrity-checked sync),
   `AppPreferences`, clearance stripped from client payloads, Config/UI/About,
   safer SwiftData without wiping App Group, UITests + 87 unit tests green.
2. **Owner next:** commit when ready (submodule then monorepo pointer); decide
   Alipay device plan (prod still lacked `/api/app/alipay/auth-info` last check —
   no deploy unless asked).
3. **Out of scope unless asked:** Android polish, SRS, WeChat, account-linking
   migration across Alipay APPID `open_id`s.

When blocked on console credentials, physical device, or deploy: stop and leave a
short owner checklist. Do not invent credentials or merge accounts.
