# Google Auth — utilizador do jogo e memória de progresso

Estado: **implementado** (jun 2026). Login Google + **One Tap** no jogo (`/phrase-game`). Histórico de pontuação ainda por fazer (Fase 2).

**Stack:** Auth.js (NextAuth) v5 + Google OAuth.

**Cliente GCP `ChineseSite`** (projeto `itcs-websites`):

- Client ID: `676957671832-o375clvsf6pi2focme9mk62kfgcef109.apps.googleusercontent.com`
- JSON: `local/credentials/google-oauth-client.json` (gitignored)

---

## Stack

| Peça | Valor |
|------|-------|
| Biblioteca | `next-auth@^5.0.0-beta.30` (a instalar em `web/`) |
| Provider | Google OAuth + sessão JWT |
| Cliente GCP | **ChineseSite** |
| Segredo sessão | `NEXTAUTH_SECRET` / `AUTH_SECRET` |
| Acesso | Qualquer conta Google (sem allowlist) |
| Credenciais | `local/credentials/credentials.json` + `google-oauth-client.json` |
| Sync env | `node scripts/sync-env-from-credentials.mjs` |
| `basePath` site | `/aulaChines` → Auth em `/aulaChines/api/auth` |

Ficheiros em `web/` (implementados): `src/server/auth/`, `api/auth/[...nextauth]/route.server.ts`, `GoogleOneTap.tsx`, `PhraseGameSession`, SQLite `data/phrase-game.sqlite`.

---

## Google One Tap (jogo)

No `/phrase-game`, convidados veem:

1. **One Tap** — popup Google (conta já logada no browser)
2. **Botão oficial** Google Sign-In
3. **“Outra conta”** — OAuth redirect clássico (`signIn("google")`)

One Tap envia o `credential` (JWT) para o provider Auth.js `google-onetap` (`Credentials`), validado com JWKS Google (`jose`).

**Requisito client-side:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (= mesmo Client ID do GCP **ChineseSite**). O script `dev.mjs` copia de `GOOGLE_CLIENT_ID` se faltar.

**Origins JavaScript** no GCP têm de incluir o host exacto (`127.0.0.1:34827`, não `localhost`, se usares 127.0.0.1 no browser).

---

---

## Contrato de URIs (ChineseSite no GCP)

**Fonte de verdade:** `local/credentials/google-oauth-client.json` → bloco `oauth_uri_contract` em `credentials.json`.

### Origins (entrada — sem path)

| URI | Uso |
|-----|-----|
| `http://127.0.0.1:34827` | Dev — `./start.sh` |
| `http://127.0.0.1:34902` | Local Node — `./start.sh --local` |
| `https://webplace.cc` | Produção |

Opcional se usares `localhost` no browser: `http://localhost:34827`, `http://localhost:34902`.

### Redirects (callback)

| URI | Uso |
|-----|-----|
| `http://127.0.0.1:34827/aulaChines/api/auth/callback/google` | Dev |
| `http://127.0.0.1:34902/aulaChines/api/auth/callback/google` | Local Node |
| `https://webplace.cc/aulaChines/api/auth/callback/google` | Produção |

### `NEXTAUTH_URL` (env = URL do browser, sem barra final)

| Ambiente | Valor |
|----------|-------|
| Dev | `http://127.0.0.1:34827/aulaChines` |
| Local Node | `http://127.0.0.1:34902/aulaChines` |
| Produção | `https://webplace.cc/aulaChines` |

**Regra:** host + porta do env têm de coincidir com o browser (`127.0.0.1` ≠ `localhost` para o Google).

Rotas Auth (debug): `…/signin/google`, `…/callback/google`, `…/session`.

---

## Portas locais (fixas)

Fonte geral: [04_operacao_local.md](04_operacao_local.md). **Não mudar portas** sem actualizar GCP + `credentials.json` + env.

| Porta | Comando | OAuth? |
|------:|---------|--------|
| **34827** | `./start.sh` | sim |
| **34902** | `./start.sh --local` | sim |
| **34901** | `./start.sh --webplace` | **não** (só estático) |

Erros típicos: `--local` (34902) com `NEXTAUTH_URL` em 34827; estático 34901; `--port=` sem URI nova no GCP.

---

## API LLM vs OAuth

| Serviço | Variável | Afecta OAuth? |
|---------|----------|---------------|
| Site (auth, jogos, tutor proxy) | `NEXTAUTH_URL` | **sim** |
| API LLM | `LLM_API_URL` | **não** |

Mudar só a LLM → actualiza `LLM_API_URL` / token. OAuth **ChineseSite** fica igual.

Mudar domínio, `basePath` ou portas locais → actualiza GCP, `credentials.json`, `sync-env-from-credentials.mjs`.

---

## Variáveis de ambiente

```bash
node scripts/sync-env-from-credentials.mjs
```

Saída automática (gitignored):

| Ficheiro | Uso |
|----------|-----|
| `web/.env.local` | Dev 34827 + LLM local + auth |
| `web/deploy/server.env` | Produção / `deploy:node` |
| `generated/web.auth.env.local-node` | Auth 34902 (`--local`) |

| Variável | Notas |
|----------|-------|
| `AUTH_TRUST_HOST` | `true` em prod atrás nginx |
| `NEXTAUTH_URL` / `AUTH_URL` | Com `/aulaChines`, sem barra final |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Client **ChineseSite** |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Mesmo Client ID (One Tap + botão GIS) |
| `AUTH_GOOGLE_*` | Aliases Auth.js v5 (opcional) |

Template: `local/credentials/credentials.example.json`.

---

## Esquema de acesso — jogo com memória

1. Convidado joga — progresso só em `localStorage`.
2. Login Google recomendado — sessão JWT 30 dias.
3. Fase 2: `GET/POST /aulaChines/api/game/progress`, histórico server-side por `userId`.

Ver [08_plano_jogo_frases.md](08_plano_jogo_frases.md).

---

## Ativar login local (checklist)

```bash
# 1. Credenciais (fora do git)
cp local/credentials/credentials.example.json local/credentials/credentials.json
# preencher google_oauth + NEXTAUTH_SECRET (openssl rand -base64 32)

# 2. Gerar env (tudo de uma vez)
node scripts/sync-env-from-credentials.mjs

# 3a. Dev hot reload (34827)
cd web && npm run dev:auth

# 3b. Local Node como prod (34902)
./start.sh --local

# 4. Jogo — usar 127.0.0.1 (não localhost)
open http://127.0.0.1:34827/aulaChines/phrase-game   # dev
open http://127.0.0.1:34902/aulaChines/phrase-game   # --local
```

Produção: `web/deploy/server.env` já gerado — `npm run deploy:node`. Ver [06_deploy.md](06_deploy.md).

OAuth **não** funciona em export estático (`build:webplace`) — convidado only. Ver [06_deploy.md](06_deploy.md).

---

## Implementação

- [x] `next-auth` em `web/`
- [x] Auth routes + `SessionProvider` (só `/phrase-game`)
- [x] Google One Tap + botão + nick SQLite
- [ ] API progresso com pontuação (fase 2)
- [ ] Botão Google em `/gamification` (opcional)

---

## Ficheiros locais

| Caminho | Git |
|---------|-----|
| `credentials.example.json`, `google-oauth-client.example.json` | sim |
| `credentials.json`, `google-oauth-client.json`, `generated/*` | **não** |

*Última revisão: jun 2026*
