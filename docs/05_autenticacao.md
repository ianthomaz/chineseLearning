# Autenticação e utilizadores

Estado: **Google (site) + Alipay (site) + e-mail e senha (site e app) + Apple (app)** — nov 2026.
Jogo de frases **não exige login**. Desenho das contas: § Contas, logo abaixo.

Pontuação persistente: [06_jogo_frases.md](06_jogo_frases.md) § Pontuação.

---

## Modelo de utilizador

Tabela `users` — PK = id interno (`u_…`; usuários anteriores a nov 2026 mantêm o
`sub` do Google como id). Colunas: `email`, `name`, `image`, `nick`, `clearance`
(NOIA), `password_hash`, `email_verified_at`, timestamps. Como cada login chega
ao id: § Contas.

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

- Auth.js v5 — Google OAuth + One Tap (`google-onetap`) + Alipay (callback próprio, RSA2)
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

## Alipay (site)

Aplicação web: **LearnChineseToday**, APPID `2021007115619132`, já launched.
Aplicação móvel (iOS, bundle `today.learnchinese.app`): APPID `2021007115685095`, também launched (nov 2026). O login Alipay no app iOS ainda não está feito.

Chaves, fora do git: `_credentials/alipay/learnchinese.json` — **raiz** = app web
(LearnChineseToday). O bloco `mobile_app` é o iOS e não entra no site.
Índice: `_credentials/credentialsMap.json` → `alipay.learnchinese`.
`node scripts/sync-env-from-credentials.mjs` lê a raiz (ou `launched_app` em
cópias antigas) e escreve o env (gitignored). A chave privada assina o pedido;
`alipay_public_key` confere a resposta.

| Variável | Para quê |
|---|---|
| `ALIPAY_APP_ID` | APPID da aplicação launched |
| `ALIPAY_APPLICATION_PRIVATE_KEY` | Assina `alipay.system.oauth.token` |
| `ALIPAY_PUBLIC_KEY` | Confere a resposta da Alipay |
| `ALIPAY_GATEWAY` | `https://openapi.alipay.com/gateway.do` |
| `NEXT_PUBLIC_AUTH_ALIPAY=1` | Mostra o botão |

O botão abre `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm` com `scope=auth_user`. A pessoa volta para `/api/auth/alipay/callback` com um `auth_code` (vale uma vez). O servidor troca o código (`open_id`), chama `alipay.user.info.share` (nick/avatar; e-mail se a Alipay enviar) e grava a sessão Auth.js. O access token não fica guardado.

Conta: `accounts.provider = alipay`, id = `open_id`. Se vier e-mail no share, o mesmo merge por e-mail verificado do Google aplica-se. Sem e-mail, conta só pelo `open_id`. Nasce O4 (`oauth_signup`). Isto é só no site.

No console da Alipay a URL de retorno tem de ser exactamente:

`https://learnchinese.today/api/auth/alipay/callback`

Código: `web/src/server/auth/alipay.ts`, rotas `web/src/app/api/auth/alipay/{start,callback}/route.server.ts`. Teste: `cd web && npm run test:alipay`.

---

## Contas — um usuário, várias entradas (implementado nov 2026)

Código: `web/src/server/db/identity.ts` (dados), `server/account/service.ts`
(fluxos), `server/auth/noia.ts` (clearance), `server/auth/index.ts` (Auth.js).

### Clearance NOIA

Porte fiel de `ianthomaz/025_noiaShell` `server/noia.js`: UC = letra + dígito,
N (visitante) < O (outsider) < I (insider) < A (admin), deny-by-default.

| Situação | UC | Origem (`clearance_changes.source`) |
|---|---|---|
| Sem sessão | N0 | — |
| Cadastro por e-mail, link ainda não aberto | **O1** | `signup` |
| Conta liberada: link aberto, ou login Google/Apple/Alipay | **O4** | `email_verified` · `oauth_signup` · `password_reset` |
| Usuários Google anteriores a nov 2026 | O4 | `migration` |

"Tem conta" = `can(uc, "O4|I0|A0")` (`isReleased`). Mudar o nível é só em
`CLEARANCE` (`noia.ts`). Toda mudança fica em `clearance_changes` (append-only,
mesmo formato do noia.dev).

### Tabelas

| Tabela | Papel |
|---|---|
| `accounts` | (provider, provider_account_id) → user_id. Providers: `google`, `apple`, `alipay` (id = `open_id`), `email` (id = e-mail normalizado) |
| `app_sessions` | Token Bearer do app iOS — só o SHA-256; 180 dias, renova com o uso |
| `email_tokens` | Links por e-mail: `verify` (72 h, pode reabrir) · `reset` (2 h, uso único) |
| `clearance_changes` | Auditoria NOIA |

Juntar contas: **só por e-mail verificado**. Google + e-mail/senha com o mesmo
endereço = mesmo usuário (OAuth já verificado pode receber senha sem segundo
link; confirm e forgot preferem o user liberado). E-mail "Hide My Email" da
Apple nunca casa — fica conta separada. Testes: `cd web && npm run test:identity`.

### E-mail e senha

- **Cadastro** (`POST /api/account/register`): e-mail duas vezes, sugestão de
  domínio no formulário (`web/src/lib/email-check.ts` — hotmal→hotmail,
  gmail.com.br→gmail.com, google.com.br→gmail.com), DNS do domínio (MX/A) no
  servidor, senha com 8+ caracteres (scrypt). Conta nasce O1 e recebe o link; **a senha vai dentro do link** e só entra no usuário quando ele é aberto (também quando o endereço já é de um usuário Google/Apple/Alipay).
- **Link** (`/account/verify?token=`): libera (O4). Abrir de novo não quebra
  (scanners de e-mail abrem links).
- **Entrar**: site = Auth.js Credentials `password`; app = `POST /api/app/auth/password`.
  Conta O1 recebe `email_not_verified` (+ botão "enviar o link de novo").
- **Esqueci a senha** (`/api/account/password/forgot` → `/account/reset-password`):
  serve também para usuário Google/Apple criar uma senha. Reset derruba as
  sessões do app.
- E-mail transacional: **Resend** (`server/email/resend.ts`, REST, sem SDK).
  Sem `RESEND_API_KEY` o link sai no log do servidor (dev).

### App iOS

`POST /api/app/auth/{password|apple|google}` → `{ token, account }`. O token vai
em `Authorization: Bearer` para `/api/account` (GET/DELETE), `/api/game/round`,
`/api/game/progress`. Sair: `DELETE /api/app/session`. Rodadas do app são
idempotentes por `roundId`. Lado do app: `appApple/docs/08_login.md`.

### Variáveis (credentials.json → `scripts/sync-env-from-credentials.mjs`)

| Variável | Para quê |
|---|---|
| `RESEND_API_KEY`, `RESEND_FROM` | Links por e-mail (domínio verificado no Resend) |
| `APPLE_APP_BUNDLE_ID` | `aud` do token Apple do app (default `today.learnchinese.app`) |
| `GOOGLE_IOS_CLIENT_ID` | Aceitar o ID token do Google Sign-In do app |
| `AUTH_APPLE_ID`, `AUTH_APPLE_SECRET`, `NEXT_PUBLIC_AUTH_APPLE=1` | Apple **no site** (opcional). Secret: `node scripts/apple-client-secret.mjs`, renovar a cada 6 meses |
| `ALIPAY_APP_ID`, `ALIPAY_APPLICATION_PRIVATE_KEY`, `ALIPAY_PUBLIC_KEY`, `NEXT_PUBLIC_AUTH_ALIPAY` | Alipay no site. Ver § Alipay. Fonte: raiz do JSON web; não `mobile_app` |

### Perguntas para o dono (sim/não)

Implementado com a opção marcada; responder só se for "não".

1. ~~Conta liberada~~ — decidido: **O4**.
2. ~~Cadastro sem confirmar~~ — decidido pelo dono: **O1**. Níveis NOIA deste projeto: N0 sem conta · O1 e-mail+senha sem confirmar · O4 conta confirmada.
3. **Juntar automaticamente** Google + e-mail/senha quando o e-mail verificado é o mesmo? — sim.
4. Cadastro com e-mail que já tem conta responde **"já tem conta"** (revela que o e-mail existe; mais claro para o usuário)? — sim.
5. Admin continua sendo **por e-mail** (`NEXT_PUBLIC_ADMIN_EMAIL`), sem virar A7 no NOIA por enquanto? — sim.
6. Apple **no site** fica para depois (só app agora)? — sim; estrutura pronta.

7. **Alipay: juntar por e-mail?** Hoje, se a Alipay devolve um e-mail, ele é
   tratado como **verificado** e junta com o usuário Google/e-mail do mesmo
   endereço. A Alipay não documenta que esse e-mail é confirmado; se não for, dá
   para alguém pôr o e-mail de outra pessoa na Alipay e entrar na conta dela.
   Recomendo **não** juntar por e-mail da Alipay (conta separada; juntar depois
   com "conectar outra conta"). Mantive como você fez até responder — é uma linha
   em `api/auth/alipay/callback` (`emailVerified`).

### O que falta de você (não é pergunta — é credencial/ação)

- **Resend**: domínio `learnchinese.today` verificado (remetente `no-reply@learnchinese.today`) — feito na conta e404.
- **Google iOS**: client ID no `credentials.json` + Secrets — ver `appApple/docs/08_login.md`.
- **Deploy** quando fores pôr `/api/app/auth/*` em produção (código local já tem).
- Apple no site (opcional): Services ID + chave `.p8`.
- Merge identity: `cd web && npm run test:identity`.

---

## Pendências de login (revisão nov 2026)

O desenho original (anotado antes da implementação) foi substituído por § Contas.
O que ainda falta, por ordem — a sequência geral está em
[09_roadmap_integracoes.md](09_roadmap_integracoes.md):

| Item | Onde | Bloqueio |
|---|---|---|
| Deploy das contas (e-mail, Apple app, Alipay) | servidor | ação do dono |
| Google Sign-In no app | app | client ID iOS (credencial) |
| Alipay no app iOS | app | SDK Alipay ou login via site em `ASWebAuthenticationSession` |
| Excluir conta **no site** | site | só UI — API `DELETE /api/account` já existe |
| "Conectar outra conta" com sessão ativa (ex.: Alipay sem e-mail + Google) | site + app | desenho de UI |
| Revogar token Apple ao excluir conta | servidor | chave `.p8` |
| Apple no site | site | Services ID + chave `.p8` |
| WeChat | — | conta Tencent (§ WeChat) |
| Passkeys | site + app | depois do resto |

### Revisão de segurança (nov 2026) — corrigido

- **Cadastro com e-mail de outra pessoa.** Registrar um endereço que já era de
  um usuário Google/Apple/Alipay gravava a senha nesse usuário na hora — qualquer
  um tomava a conta. Agora o cadastro **não escreve nada** num usuário existente:
  o hash da senha vai dentro do link enviado (`email_tokens.password_hash`) e só
  entra no usuário quando o link é aberto. Mesmo para cadastro pendente (O1):
  sem senha até o link. Teste: `npm run test:identity`.
- **Conta excluída "voltava".** Cookie do site (JWT, 30 dias) de conta excluída
  recriava o usuário ao gravar rodada. Agora sessão de usuário inexistente = deslogado.
- Hash fictício literal no código (alerta "Generic Password") removido.

---

## Smoke test

```bash
curl -s http://127.0.0.1:34827/api/auth/session          # {} sem login
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:34827/api/phrase-game/bank            # 200 convidado
```
