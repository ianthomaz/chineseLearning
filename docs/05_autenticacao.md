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
Aplicação móvel (iOS + Android, bundle/package `today.learnchinese.app`):
APPID `2021007115685095`, launched; produto **APP支付宝登录** / app_API online
(nov 2026). Login nativo: AlipaySDK `auth_V2` — o servidor assina o `infoStr`
(`GET /api/app/alipay/auth-info`, PID `2088…` em `mobile_app.pid`) e o app envia
o `auth_code` em `POST /api/app/auth/alipay` com as chaves do APPID móvel.
Prod: `auth-info` **200**; login nativo iOS + Android OK; **union_id** web↔app
confirmado (6 nov 2026). Checklist aparelho: `appMobile/docs/08_login.md`.

Chaves, fora do git: `_credentials/alipay/learnchinese.json` — **raiz** = app web
(LearnChineseToday); bloco `mobile_app` = iOS (APPID móvel + PID + chaves).
Índice: `_credentials/credentialsMap.json` → `alipay.learnchinese`.
`node scripts/sync-env-from-credentials.mjs` lê a raiz e, se `mobile_app.pid`
estiver preenchido (`2088…`), também o bloco móvel — escreve o env (gitignored).

| Variável | Para quê |
|---|---|
| `ALIPAY_APP_ID` | APPID da aplicação web launched |
| `ALIPAY_APPLICATION_PRIVATE_KEY` | Assina `alipay.system.oauth.token` (site) |
| `ALIPAY_PUBLIC_KEY` | Confere a resposta da Alipay (site) |
| `ALIPAY_GATEWAY` | `https://openapi.alipay.com/gateway.do` |
| `NEXT_PUBLIC_AUTH_ALIPAY=1` | Mostra o botão no site |
| `ALIPAY_MOBILE_APP_ID` | APPID iOS (`mobile_app.app_id`) |
| `ALIPAY_MOBILE_PID` | Conta comerciante `2088…` (`mobile_app.pid`) |
| `ALIPAY_MOBILE_APPLICATION_PRIVATE_KEY` | Assina `infoStr` / troca do `auth_code` no app |
| `ALIPAY_MOBILE_PUBLIC_KEY` | Confere a resposta (APPID móvel) |

O botão abre `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm` com `scope=auth_user`. A pessoa volta para `/api/auth/alipay/callback` com um `auth_code` (vale uma vez). O servidor chama **`alipay.system.oauth.token`** (não `user.info.share` para identidade), lê `union_id` + `open_id`, e opcionalmente `alipay.user.info.share` só para nick/avatar. O access token não fica guardado.

Conta: `accounts.provider = alipay`, id = **`union_id`** quando a Alipay devolve; senão fallback legado ao `open_id`. Mapeamento por APPID em `alipay_open_ids` (`app_id`, `open_id`, `union_id`, `user_id`). E-mail do share é dado de
perfil **não verificado** (`emailVerified=false`), sem merge automático e sem
entrar no e-mail da sessão usado pelos gates admin/curador. Nasce O4
(`oauth_signup`) tanto no site quanto no app.

### Identidade entre os dois APPIDs — `union_id`

Âncora = `union_id` de `alipay.system.oauth.token`; `open_id` por APPID em
`alipay_open_ids`. Mesmo `union_id` → mesmo `users.id` (`resolveAlipayUser`).
Sem `union_id`, cada APPID fica conta separada. Conflito union vs open em
*users* diferentes: mantém o do `union_id`, sem merge automático.

[ x ] Site↔app Alipay unificado por `union_id` (nov 2026).  
[ x ] Backend de vincular **outro** provedor / e-mail com sessão ativa (`POST /api/account/link` + confirmação com merge seguro de progresso e contas). Teste: `npm run test:account-link`.  
[ ] UI para acionar o vínculo na tela de Conta (site e app).

No console da Alipay a URL de retorno tem de ser exactamente:

`https://learnchinese.today/api/auth/alipay/callback`

Código: `web/src/server/auth/alipay.ts`, rotas `web/src/app/api/auth/alipay/{start,callback}/route.server.ts`. Teste: `cd web && npm run test:alipay`.

---

## Apple no site — passo a passo (para o dono, no computador)

Por que não aparece hoje: o botão só aparece quando o servidor tem o
**Services ID** e a **chave .p8**. O app já usa Apple (só precisa do bundle).

No [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list) (Team `7Z7GR6UFNZ`):

1. **Identifiers → + → Services IDs** → identificador `today.learnchinese.web`
   (nome "LearnChinese Today Web"). Marcar **Sign in with Apple → Configure**:
   - Primary App ID: `today.learnchinese.app` (assim o mesmo usuário tem o
     mesmo `sub` no site e no app);
   - Domains: `learnchinese.today`;
   - Return URLs: `https://learnchinese.today/api/auth/callback/apple`.
2. **Keys → +** → nome "LearnChinese Sign in with Apple", marcar **Sign in with
   Apple** (Configure → Primary App ID `today.learnchinese.app`). Baixar o
   `AuthKey_XXXXXXXXXX.p8` (só baixa uma vez) e anotar o **Key ID**.
3. Colocar o `.p8` em `local/credentials/` e preencher `credentials.json → apple`:
   `AUTH_APPLE_ID = today.learnchinese.web`, `key_id`, `private_key_file`
   (`team_id` já é `7Z7GR6UFNZ`).
4. `node scripts/sync-env-from-credentials.mjs` → deploy.

O servidor assina o próprio client secret a partir da chave
(`web/src/server/auth/apple-secret.ts`) — **não** expira a cada 6 meses (renova
a cada deploy/restart). Os cookies de checagem do Auth.js vão como
`SameSite=None` porque a Apple devolve o login num POST de outro site; sem isso
o login falhava. Só funciona em HTTPS (produção).

## Google no app — passo a passo

Ver `appMobile/docs/08_login.md` § Google (client ID iOS no GCP `chinese-learnin`
→ `credentials.json → google_oauth.GOOGLE_IOS_CLIENT_ID` + reversed →
`sync-env` (servidor aceita o token) e `appMobile/ios/Scripts/sync-secrets-xcconfig.mjs`
→ `xcodegen generate`).

## Contas — um usuário, várias entradas (implementado nov 2026)

Código: `web/src/server/db/identity.ts` (dados), `server/account/service.ts`
(fluxos), `server/auth/noia.ts` (clearance), `server/auth/index.ts` (Auth.js).

### Clearance NOIA

**Informação interna, nunca pública** (decisão do dono, 5 nov 2026). Site,
iOS e Android não exibem nem recebem o nível nos payloads de conta.
`accountPayload` expõe apenas `released` para o estado funcional da conta.
O nível completo e seu histórico permanecem no servidor para autorização e auditoria.

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
| `accounts` | (provider, provider_account_id) → user_id. Providers: `google`, `apple`, `alipay` (id = `union_id` ou legado `open_id`), `email` |
| `alipay_open_ids` | (app_id, open_id) → user_id + union_id opcional — mapeamento por APPID |
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

`POST /api/app/auth/{password|apple|google|alipay}` → `{ token, account }`. O token vai
em `Authorization: Bearer` para `/api/account` (GET/DELETE), `/api/game/round`,
`/api/game/progress`. Sair: `DELETE /api/app/session`. Rodadas do app são
idempotentes por `roundId`. Lado do app: `appMobile/docs/08_login.md`.

### Variáveis (credentials.json → `scripts/sync-env-from-credentials.mjs`)

| Variável | Para quê |
|---|---|
| `RESEND_API_KEY`, `RESEND_FROM` | Links por e-mail (domínio verificado no Resend) |
| `APPLE_APP_BUNDLE_ID` | `aud` do token Apple do app (default `today.learnchinese.app`) |
| `GOOGLE_IOS_CLIENT_ID` | Aceitar o ID token do Google Sign-In do app |
| `AUTH_APPLE_ID`, `AUTH_APPLE_SECRET`, `NEXT_PUBLIC_AUTH_APPLE=1` | Apple **no site** (opcional). Secret: `node scripts/apple-client-secret.mjs`, renovar a cada 6 meses |
| `ALIPAY_APP_ID`, `ALIPAY_APPLICATION_PRIVATE_KEY`, `ALIPAY_PUBLIC_KEY`, `NEXT_PUBLIC_AUTH_ALIPAY` | Alipay no site. Fonte: raiz do JSON |
| `ALIPAY_MOBILE_APP_ID`, `ALIPAY_MOBILE_PID`, `ALIPAY_MOBILE_*_KEY` | Alipay no app iOS. Fonte: `mobile_app` (precisa de `pid`) |

### Perguntas para o dono (sim/não)

Implementado com a opção marcada; responder só se for "não".

1. ~~Conta liberada~~ — decidido: **O4**.
2. ~~Cadastro sem confirmar~~ — decidido pelo dono: **O1**. Níveis NOIA deste projeto: N0 sem conta · O1 e-mail+senha sem confirmar · O4 conta confirmada.
3. **Juntar automaticamente** Google + e-mail/senha quando o e-mail verificado é o mesmo? — sim.
4. Cadastro com e-mail que já tem conta responde **"já tem conta"** (revela que o e-mail existe; mais claro para o usuário)? — sim.
5. Admin continua sendo **por e-mail** (`NEXT_PUBLIC_ADMIN_EMAIL`), sem virar A7 no NOIA por enquanto? — sim.
6. Apple **no site** fica para depois (só app agora)? — sim; estrutura pronta.

7. **Alipay: juntar por e-mail?** **Não**, conforme instrução do dono de 5 nov
   2026: `emailVerified=false` no site e no app. O share não comprova verificação
   do endereço. A mudança impede novos merges por esse dado; não desfaz merges
   históricos nem revoga cookies antigos. Contas já associadas exigem auditoria
   antes de qualquer separação. Conexão explícita de identidades continua pendente.

### Credenciais / acções do dono

[ x ] Resend `no-reply@learnchinese.today`; Google iOS no Secrets; `/api/app/*` em prod.  
[ ] Apple no site (Services ID + `.p8`) se fores ativar.  
Teste: `cd web && npm run test:identity`.

---

## Pendências de login

Ordem geral: [09_roadmap_integracoes.md](09_roadmap_integracoes.md).

| Item | Onde | Nota |
|---|---|---|
| Excluir conta **no site** | site | API `DELETE /api/account` pronta — falta UI |
| Vincular outra conta (sessão ativa) | site + app | Alipay↔Alipay já por `union_id` |
| Revogar token Apple ao excluir | servidor | chave `.p8` |
| Apple no site | site | Services ID + `.p8` |
| Ícones oficiais das redes nos botões | site + app | SVG básico no site |
| WeChat / Passkeys | — | depois |

### Segurança (já corrigido)

[ x ] Cadastro não escreve senha em user existente até o link; sessão de conta
excluída não recria user; hash fictício removido. `npm run test:identity`.

---

## Smoke test

```bash
curl -s http://127.0.0.1:34827/api/auth/session          # {} sem login
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:34827/api/phrase-game/bank            # 200 convidado
```
