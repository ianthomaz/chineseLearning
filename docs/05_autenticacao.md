# Autenticação e utilizadores

Estado: **Google OAuth activo** (set 2026). Jogo de frases **não exige login**.

Pontuação persistente: [06_jogo_frases.md](06_jogo_frases.md) § Pontuação.

---

## Modelo de utilizador

Tabela `users` — PK = Google OIDC `sub`. Colunas: `email`, `name`, `image`, `nick` (único editável), timestamps.

**Admin** (`/backoffice`): `NEXT_PUBLIC_ADMIN_EMAIL` — `isAdminEmail` no servidor.

**Curador** (`/registerClass`, `/reviewClass`): mesma lista hoje — `requireCurator` no servidor (`web/src/server/auth/session.ts`).

### Convidado vs logado

| | Convidado | Logado |
|---|---|---|
| ID | `pg_anon_id` (localStorage) | `users.id` (sessão JWT) |
| Telemetria jogo | `POST /api/game/events` com `anonId` | + `user_id` do servidor |
| Prova de identidade | Não | Cookie assinado |

Ligar `anon_id` → `user_id` no login = **Fase 2** (não implementado).

---

## O que fica guardado

### Tabela `events` (telemetria jogo)

Eventos: `game_enter`, `round_start`, `phrase_result`, `help_used`, `round_abandon`, `round_complete`.

Leitura: `/backoffice` (admin). Detalhe: [06_jogo_frases.md](06_jogo_frases.md) § Backoffice.

### `users.nick`

`GET`/`POST /api/game/progress` — só apelido. **Não** grava pontuação.

### Não guardado (Fase 2)

Pontuação agregada, tabela `progress`, histórico visível ao jogador, SRS.

---

## Rotas e gates

| Rota | Gate |
|------|------|
| `/phrase-game`, `/ktv`, conteúdo estático | **Nenhum** |
| `/tutor`, `/praticar`, `/gamification` | `LoginGate` |
| `/registerClass`, `/reviewClass`, `/api/lessons/**` | Curador |
| `/backoffice` | Admin |
| `/api/chat` | Sessão obrigatória |

Export estático (`NEXT_PUBLIC_AUTH_ENABLED=0`): sem auth routes.

---

## Stack

- Auth.js v5 — Google OAuth + One Tap (`google-onetap`)
- JWT 30 dias · SQLite `web/data/phrase-game.sqlite`
- `basePath` vazio → `/api/auth/*`

Código: `web/src/server/auth/`, `SiteNavAuth.tsx`, `AuthPanel.tsx`.

---

## GCP OAuth (`chinese-learnin`)

| Ambiente | `NEXTAUTH_URL` |
|----------|----------------|
| Dev | `http://127.0.0.1:34827` |
| Local Node | `http://127.0.0.1:34902` |
| Produção | `https://learnchinese.today` |

Redirect: `…/api/auth/callback/google` · Privacy/Terms: `/privacy`, `/terms`

Fonte: `local/credentials/google-oauth-client-learnchinese.json` + `sync-env-from-credentials.mjs`

Deploy OAuth: [03_operacao_e_deploy.md](03_operacao_e_deploy.md)

---

## WeChat (futuro — não implementado)

Auth.js tem provider WeChat, mas o bloqueio é **administrativo**:

- Precisa **Website App** na WeChat Open Platform (QR login, `snsapi_login`)
- Conta de programador verificada + domínio aprovado pela Tencent
- `redirect_uri` exacto: `https://learnchinese.today/api/auth/callback/wechat`

**Recomendação:** resolver conta Tencent antes de código. Checklist completo quando for prioridade — pedir ao dono do projeto.

---

## Smoke test

```bash
curl -s http://127.0.0.1:34827/api/auth/session          # {} sem login
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:34827/api/phrase-game/bank            # 200 convidado
```
