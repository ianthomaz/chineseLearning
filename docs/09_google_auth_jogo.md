# Google Auth — utilizador do jogo e memória de progresso

Estado: **planeado** (jun 2026). Login Google para identificar quem joga e **persistir histórico** (frases, acertos, níveis).

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

Ficheiros previstos em `web/` (implementação pendente): `auth.config.ts`, `auth.ts`, `google-oauth-env.ts`, `api/auth/[...nextauth]/route.ts`, `SessionProvider`.

OAuth **não** funciona em export estático (`build:webplace`) — precisa `build:server` + `next start`. Ver [06_deploy.md](06_deploy.md).

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

Saída (gitignored): `generated/web.auth.env.local` → `web/.env.local`; `generated/deploy.auth.env` → `web/deploy/server.env`.

| Variável | Notas |
|----------|-------|
| `AUTH_TRUST_HOST` | `true` em prod atrás nginx |
| `NEXTAUTH_URL` / `AUTH_URL` | Com `/aulaChines`, sem barra final |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Client **ChineseSite** |
| `AUTH_GOOGLE_*` | Aliases Auth.js v5 (opcional) |

Template: `local/credentials/credentials.example.json`.

---

## Esquema de acesso — jogo com memória

1. Convidado joga — progresso só em `localStorage`.
2. Login Google recomendado — sessão JWT 30 dias.
3. Fase 2: `GET/POST /aulaChines/api/game/progress`, histórico server-side por `userId`.

Ver [08_plano_jogo_frases.md](08_plano_jogo_frases.md).

---

## Implementação (pendente)

- [ ] `next-auth` em `web/`
- [ ] Auth routes + `SessionProvider`
- [ ] Botão Google em `/gamification`
- [ ] API progresso (fase 2)

---

## Ficheiros locais

| Caminho | Git |
|---------|-----|
| `credentials.example.json`, `google-oauth-client.example.json` | sim |
| `credentials.json`, `google-oauth-client.json`, `generated/*` | **não** |

*Última revisão: jun 2026*
