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

`POST /api/game/progress` — só apelido. `GET` devolve apelido **+** resumo por
jogo e últimas rodadas.

### Progresso (implementado set 2026)

`POST /api/game/round` grava uma rodada terminada em `game_rounds` + `progress`,
para os dois jogos. **Só com sessão** — convidado recebe 401 e fica apenas com o
log `events`, que é o que o banner de cookies promete.

### Não guardado

Ligar o `anon_id` do convidado ao `user_id` no login, e repetição espaçada a
sério (a fila "a rever" existe, o agendamento não).

---

## Rotas e gates

| Rota | Gate |
|------|------|
| `/phrase-game`, `/ktv`, conteúdo estático | **Nenhum** |
| `/tutor`, `/practice`, `/gamification` | `LoginGate` |
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

## Roadmap de login — site + app (anotado nov 2026, não implementado)

Objetivo: o mesmo usuário no site e no app iOS, com a mesma pontuação.
Hoje só existe **Google no site**; o app não tem login.

### 1. Base: `accounts` antes de qualquer provedor novo

`users.id` = `sub` do Google não aguenta Apple, Facebook nem e-mail.

- `users.id` passa a ser id interno. Usuários atuais **mantêm** o id que têm (o
  `sub` do Google vira só um id) → `progress`, `game_rounds`, `events`, `lessons`
  não mudam.
- Tabela nova `accounts(provider, provider_account_id, user_id, email,
  email_verified, created_at)`, `UNIQUE(provider, provider_account_id)`.
  Backfill: uma linha `('google', id, id)` por usuário existente.
- `signIn`/`jwt` em `server/auth/index.ts` resolvem provedor+sub → `users.id`.
- Alterar também `schema.prisma` + [07](07_conteudo_dados.md).

### 2. App: token próprio

Cookie do Auth.js não serve para o app.

- App faz login nativo (Sign in with Apple / Google Sign-In) → `POST
  /api/app/auth/{apple,google}` com o ID token.
- Servidor valida (JWKS do provedor; `aud` = bundle `today.learnchinese.app` ou o
  client id iOS do Google), resolve via `accounts`, devolve token de sessão do app
  (opaco, guardado com hash numa tabela `app_sessions` → dá para revogar).
- `/api/game/round` e `/api/game/progress` aceitam cookie **ou** Bearer
  (helper único `getRequestUser(req)`).
- App guarda rodadas offline com `roundId` próprio e envia depois (exige
  `UNIQUE(user_id, round_id)` — ver [07](07_conteudo_dados.md)).

### 3. Apple

- Site: Auth.js `providers/apple` (já vem no `next-auth` instalado). Precisa de
  Services ID, chave `.p8`, domínio verificado, retorno
  `https://learnchinese.today/api/auth/callback/apple`. O client secret é um JWT
  que expira (máx. 6 meses) → gerar em runtime a partir da `.p8`.
- **O `sub` só é igual no site e no app se o Services ID estiver agrupado com o
  App ID principal** (`today.learnchinese.app`) no mesmo Team.
- E-mail pode vir como "Hide My Email" (`privaterelay.appleid.com`): não bate com
  nada; para enviar e-mail para esses endereços, registrar o domínio remetente no
  serviço de relay da Apple.
- Regras da loja: excluir conta **dentro do app** (5.1.1(v)) e, com Apple,
  revogar o token na Apple ao excluir. Se o app tiver Google, tem de ter Apple (4.8).

### 4. E-mail: código de 6 dígitos, não senha

Recomendação para o "e-mail e senha":

- Login por **código enviado por e-mail** (passwordless). Não guarda senha, não
  tem "esqueci a senha", e o próprio login confirma o e-mail — some a maior parte
  do desdobramento (confirmação, reset).
- Encaixa no padrão existente: um Credentials provider `email-otp`, igual ao
  `google-onetap`. Endpoint `POST /api/auth/email/start` envia o código; tabela
  `email_codes(email, code_hash, expires_at, attempts)`; limite de tentativas e
  rate limit por IP/e-mail.
- Funciona igual no app (o iOS 17 preenche código vindo do Mail).
- Precisa de provedor de e-mail transacional. Entrega para QQ Mail / 163 a testar.
- "OpenID" não é uma opção a mais para o usuário: é o protocolo por baixo de
  Google e Apple. Passkeys: boa camada futura por cima do e-mail.

### 5. Facebook

- Só no site (Auth.js `providers/facebook`). No app não: o SDK do Facebook traz
  rastreamento e ATT.
- A Meta exige URL de política de privacidade e **callback de exclusão de dados**
  (`signed_request` → `{ url, confirmation_code }`). Montar junto com o provedor.
- E-mail do Facebook não é garantidamente verificado → **não** juntar contas
  automaticamente por e-mail; só ligar com o usuário já logado.

### 6. Juntar contas

Automático só com e-mail verificado (Google `email_verified`, Apple, código por
e-mail). Restante: "conectar outra conta" com sessão ativa.

### 7. China

Google e Facebook não funcionam na China continental sem VPN; Apple funciona.
Quem está na China sem iPhone fica sem opção até existir o e-mail com código.
WeChat: ver abaixo (bloqueio administrativo).

Ordem sugerida: 1 → 2 → Apple (site + app) → Google no app → e-mail → Facebook.

---

## Smoke test

```bash
curl -s http://127.0.0.1:34827/api/auth/session          # {} sem login
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:34827/api/phrase-game/bank            # 200 convidado
```
