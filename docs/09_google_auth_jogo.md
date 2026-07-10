# Google Auth — site-wide (sessão JWT + SQLite)

Estado: **OAuth global** (jul 2026). Login Google + JWT 30 dias em **todo o site** (modo servidor). UI de login completa (One Tap + nick) continua no **jogo de frases**; nav mostra estado de sessão (Entrar / Sair).

Histórico de pontuação do jogo ainda por fazer (Fase 2 do scoring).

**Stack:** Auth.js (NextAuth) v5 + Google OAuth + SQLite `users`.

**Cliente GCP `ChineseSite`** (projeto `itcs-websites`):

- Client ID: `676957671832-o375clvsf6pi2focme9mk62kfgcef109.apps.googleusercontent.com`
- JSON: `local/credentials/google-oauth-client.json` (gitignored)

---

## Stack

| Peça | Valor |
|------|-------|
| Biblioteca | `next-auth@^5.0.0-beta.30` |
| Provider | Google OAuth + `google-onetap` (Credentials) |
| Sessão | JWT, 30 dias |
| Utilizadores | Tabela SQLite `users` (Google `sub` = PK) |
| Credenciais | `local/credentials/credentials.json` + sync script |
| `basePath` | `/aulaChines` → Auth em `/aulaChines/api/auth` |

Ficheiros principais:

| Caminho | Função |
|---------|--------|
| `web/src/server/auth/` | Auth.js config + callbacks |
| `web/src/server/auth/session.ts` | `getSessionUser()`, `requireSession()` |
| `web/src/server/db/users.ts` | `upsertUser`, `getUser`, `setNick` |
| `web/src/components/AuthSessionProvider.tsx` | `SessionProvider` no root |
| `web/src/components/SiteNavAuth.tsx` | Entrar / avatar / Sair no nav |
| `web/data/phrase-game.sqlite` | BD (env `SITE_DB` ou `PHRASE_GAME_DB`) |

Legado: `players` é **view** sobre `users`; `@/server/db/players` re-exporta aliases.

---

## Política de acesso (planeamento)

Detalhe da feature de aulas: [12_aula_registro_roadmap.md](12_aula_registro_roadmap.md) §10.

| Nível | Quem | O quê |
|-------|------|-------|
| **Curador** | `ianthomaz@gmail.com` (hardcoded MVP) | Cadastrar / editar aulas |
| **Logado** | Qualquer conta Google | Treino hanzi, tutor, jogos/quiz — **a implementar** (hoje muitas rotas aceitam convidado) |
| **Convidado** | Sem sessão | Conteúdo estático do consolidado; interactivos bloqueados ou redirect login |
| **Outros users** | Futuro | Features próprias — não definido |

---

## Sessão site-wide

- `SessionProvider` em [`Providers.tsx`](../web/src/components/Providers.tsx) — qualquer página client pode usar `useSession()`.
- Server components e Route Handlers: `import { auth } from "@/server/auth"` ou `getSessionUser()` de `session.ts`.
- Login Google (One Tap + redirect) permanece em **`/phrase-game`** — nav link **Entrar** aponta para lá.

---

## Google One Tap (jogo)

No `/phrase-game`, convidados veem:

1. **One Tap** — popup Google
2. **Botão oficial** Google Sign-In
3. **“Outra conta”** — OAuth redirect (`signIn("google")`)

**Client-side:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. FedCM: ver notas em versões anteriores deste doc; fallback **Outra conta**.

---

## Contrato de URIs (ChineseSite no GCP)

**Fonte de verdade:** `local/credentials/google-oauth-client.json` → `oauth_uri_contract` em `credentials.json`.

### Origins

| URI | Uso |
|-----|-----|
| `http://127.0.0.1:34827` | Dev |
| `http://127.0.0.1:34902` | Local Node |
| `https://webplace.cc` | Produção |

### Redirects

| URI | Uso |
|-----|-----|
| `http://127.0.0.1:34827/aulaChines/api/auth/callback/google` | Dev |
| `http://127.0.0.1:34902/aulaChines/api/auth/callback/google` | Local Node |
| `https://webplace.cc/aulaChines/api/auth/callback/google` | Produção |

### `NEXTAUTH_URL` (sem barra final)

| Ambiente | Valor |
|----------|-------|
| Dev | `http://127.0.0.1:34827/aulaChines` |
| Local Node | `http://127.0.0.1:34902/aulaChines` |
| Produção | `https://webplace.cc/aulaChines` |

---

## Portas locais

| Porta | OAuth? |
|------:|--------|
| **34827** | sim |
| **34902** | sim |
| **34901** (estático) | **não** |

Ver [04_operacao_local.md](04_operacao_local.md).

---

## Variáveis de ambiente

```bash
node scripts/sync-env-from-credentials.mjs
```

| Variável | Notas |
|----------|-------|
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Sessão JWT |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ChineseSite |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | One Tap |
| `NEXT_PUBLIC_AUTH_ENABLED` | `0` no export estático |
| `SITE_DB` / `PHRASE_GAME_DB` | Caminho SQLite |

---

## Smoke test (manual)

Com credenciais e `./start.sh` (34827):

```bash
# Sessão anónima
curl -s http://127.0.0.1:34827/aulaChines/api/auth/session

# Após login no browser (phrase-game), repetir — deve retornar user com id
```

Local Node (34902): mesmo path com porta 34902 e `NEXTAUTH_URL` correspondente.

---

## Implementação

- [x] Auth.js + rotas API
- [x] `SessionProvider` global
- [x] Tabela `users` + migração desde `players`
- [x] `getSessionUser` / `requireSession`
- [x] Nav: Entrar / Sair
- [x] Google One Tap + nick no jogo
- [ ] Gate curador aulas: `ianthomaz@gmail.com`
- [ ] Login obrigatório: treino hanzi, tutor, jogos/quiz (convidado disabled ou redirect)
- [ ] API progresso com pontuação (fase 2 jogo)

---

## Ficheiros locais

| Caminho | Git |
|---------|-----|
| `credentials.example.json` | sim |
| `credentials.json`, `google-oauth-client.json` | **não** |
| `web/data/*.sqlite` | **não** |

*Última revisão: jul 2026*
