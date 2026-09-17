# Autenticação, utilizadores e histórico

Estado: **set 2026**. Login Google site-wide (modo servidor), sessão JWT 30 dias.
O jogo de frases **não exige login** — joga-se como convidado.

Roadmap de outro provedor: [16_auth_wechat_roadmap.md](16_auth_wechat_roadmap.md).
Regras de pontuação (ainda sem persistência): [phrase-game-scoring.md](phrase-game-scoring.md).

---

## 1. Modelo de utilizador

Tabela `users` ([`web/src/server/db/users.ts`](../web/src/server/db/users.ts), modelo
`User` em [`web/prisma/schema.prisma`](../web/prisma/schema.prisma)):

| Coluna | Origem | Notas |
|--------|--------|-------|
| `id` (PK) | Google OIDC `sub` | Identificador estável da conta Google. **Não** é o email. |
| `email` | perfil Google | Usado só para `isAdminEmail`; pode mudar de conta para conta |
| `name`, `image` | perfil Google | Cópia do perfil, reescrita em cada login |
| `nick` | escrito pelo próprio | Apelido opcional, máx. 24 chars, único campo editável pelo utilizador |
| `created_at`, `updated_at` | SQLite | `datetime('now')` |

A linha é criada/actualizada no callback `signIn`
([`web/src/server/auth/index.ts`](../web/src/server/auth/index.ts)) — `upsertUser`
nunca faz a autenticação falhar se a escrita falhar.

**Admin/curador** não é uma coluna: é uma lista de emails em
[`web/src/lib/phrase-game/admin.ts`](../web/src/lib/phrase-game/admin.ts)
(`NEXT_PUBLIC_ADMIN_EMAIL`, por omissão `ianthomaz@gmail.com`). Sendo `NEXT_PUBLIC_*`
está no bundle do cliente — decide apenas **o que aparece**; o acesso real é
verificado no servidor (`requireCurator` em
[`web/src/server/auth/session.ts`](../web/src/server/auth/session.ts)).

Legado: `players` é uma **view** sobre `users` (migração automática em
`web/src/server/db/index.ts`).

## 2. Convidado vs. logado

Os dois coexistem — nunca há um "utilizador anónimo" na tabela `users`.

| | Convidado | Logado |
|---|---|---|
| Identidade | `anonId` — UUID em `localStorage["pg_anon_id"]` | `users.id` (Google `sub`) |
| Onde nasce | [`web/src/lib/phrase-game/game-log.ts`](../web/src/lib/phrase-game/game-log.ts), no 1.º evento | Callback `signIn` do Auth.js |
| Quem o define | O browser, e envia-o no corpo do POST | O **servidor**, a partir da sessão |
| Âmbito | Um browser, um dispositivo. Limpar dados do site = nova identidade | A conta Google, em qualquer dispositivo |
| Vale como prova? | Não — o cliente pode enviar o que quiser | Sim — cookie de sessão assinado |

`POST /api/game/events` grava **os dois** quando existem: lê `anonId` do corpo e
`user_id` da sessão do lado do servidor
([`route.server.ts`](../web/src/app/api/game/events/route.server.ts)). Um jogador que
entre a meio mantém o mesmo `anon_id`, o que permite ligar as duas identidades
a posteriori — mas **nada faz essa ligação hoje**.

## 3. O que fica guardado hoje

### Guardado — tabela `events`

Uma linha por acontecimento, append-only
([`web/src/server/db/events.ts`](../web/src/server/db/events.ts)):

| Evento | Quando | `detail` |
|--------|--------|----------|
| `game_enter` | abre `/phrase-game` | — |
| `round_start` | carrega em Jogar | — |
| `phrase_result` | submete uma frase | `correct` + `attempt` |
| `help_used` | usa uma ajuda | qual a ajuda |
| `round_abandon` | sai a meio | `reached:3/10` |
| `round_complete` | termina a ronda | `7/10` |

Colunas: `created_at`, `event`, `user_id`, `anon_id`, `round_id`, `tier`, `level`,
`phrase_id`, `correct`, `attempt`, `detail`, `locale`, `user_agent`.
Índices em `round_id`, `event`, `created_at`.

Quem lê: só `/backoffice` (email admin), com agregados calculados **on the fly** —
`eventStats`, `roundsByTierLevel`, `topMissedPhrases`. Ver
[phrase-game-backoffice.md](phrase-game-backoffice.md).

### Guardado — `users.nick`

`GET`/`POST /api/game/progress` lê e escreve **apenas** o apelido.
Apesar do nome, esta rota não grava progresso nenhum.

### Não guardado — o que falta (Fase 2)

| Falta | Nota |
|-------|------|
| Pontuação agregada por utilizador | [`scoring.ts`](../web/src/lib/phrase-game/scoring.ts) calcula pontos, mas o resultado só vive em memória durante a ronda |
| Tabela `progress` | Existe no schema (`user_id`, `phrase_id`, `score`) e **nunca é escrita** |
| Histórico visível ao próprio jogador | Não há rota nem ecrã; `/backoffice` é só do dono |
| Frases dominadas / a rever (SRS) | Derivável de `events.phrase_result`, por implementar |
| Ligar `anon_id` ao `user_id` no login | Os dados do convidado ficam órfãos |

Enquanto isto não existir, `phraseGame.prototypeNotice` deve continuar a dizer que
o jogo não guarda pontos — é verdade.

## 4. Rotas: o que exige login

`LoginGate` ([`web/src/components/AuthGate.tsx`](../web/src/components/AuthGate.tsx))
é um gate **bloqueante**: sem sessão mostra um cartão de login em vez do conteúdo.

| Rota | Gate | Porquê |
|------|------|--------|
| `/praticar`, `/tutor` | `LoginGate` | Chamam `/api/chat`, que faz proxy para a API LLM — custo por pedido e rate-limit por utilizador |
| `/gamification` (quiz) | `LoginGate` | Sessões de quiz destinadas a guardar progresso por utilizador (Fase 2) |
| `/registerClass`, `/reviewClass` | `requireCurator` (servidor) | Escrevem conteúdo editorial |
| `/backoffice` | `isAdminEmail` (servidor) | Telemetria de todos os jogadores |
| `/api/chat` | `requireSession` | Ver acima — nunca deve ser anónima |
| `/api/lessons/**` | `requireCurator` | CRUD de aulas |
| **`/phrase-game`** | **nenhum** | Ponto de entrada do site: quem chega deve poder jogar. Login só serve para guardar o apelido |
| **`/ktv`** | **nenhum** | Letras são material de curso, não dados de jogador |
| `/`, `/review`, `/vocabulary`, `/grammar`, `/dialogues`, `/visuals` | nenhum | Conteúdo estático do consolidado |
| `/api/game/events` | nenhum (rate-limit por IP) | Tem de aceitar convidados, senão perde-se a telemetria de quem mais interessa |

No export estático (`NEXT_PUBLIC_AUTH_ENABLED=0`) não há rotas `route.server.ts`:
`LoginGate` mostra "funcionalidade desativada" e o jogo corre em modo convidado.

---

## 5. Stack

| Peça | Valor |
|------|-------|
| Biblioteca | `next-auth@^5.0.0-beta.30` (Auth.js v5) |
| Providers | Google OAuth + `google-onetap` (Credentials, valida o ID token) |
| Sessão | JWT, 30 dias, `token.sub` = Google `sub` |
| BD | SQLite, `web/data/phrase-game.sqlite` (env `SITE_DB` / `PHRASE_GAME_DB`) |
| `basePath` | `/aulaChines` → Auth em `/aulaChines/api/auth` |

| Caminho | Função |
|---------|--------|
| [`web/src/server/auth/config.ts`](../web/src/server/auth/config.ts) | Config base (sem imports de BD) |
| [`web/src/server/auth/index.ts`](../web/src/server/auth/index.ts) | Instância + callbacks + `upsertUser` |
| [`web/src/server/auth/session.ts`](../web/src/server/auth/session.ts) | `getSessionUser`, `requireSession`, `requireCurator` |
| [`web/src/server/auth/verify-google-id-token.ts`](../web/src/server/auth/verify-google-id-token.ts) | Verificação do ID token do One Tap |
| [`web/src/components/AuthSessionProvider.tsx`](../web/src/components/AuthSessionProvider.tsx) | `SessionProvider` no root |
| [`web/src/components/SiteNavAuth.tsx`](../web/src/components/SiteNavAuth.tsx) | Entrar / avatar / Sair no nav |
| [`web/src/components/phrase-game/AuthPanel.tsx`](../web/src/components/phrase-game/AuthPanel.tsx) | Painel de login **opcional**, por baixo do ecrã de setup |

O link **Entrar** do nav aponta para `/phrase-game#phrase-game-auth` — é aí que
vive a UI completa de login (One Tap + botão + "Outra conta").

## 6. Cliente GCP e URIs

Cliente `ChineseSite` (projeto `itcs-websites`), Client ID
`676957671832-o375clvsf6pi2focme9mk62kfgcef109.apps.googleusercontent.com`.
**Fonte de verdade** dos URIs: `local/credentials/google-oauth-client.json`
(`oauth_uri_contract`), gitignored.

| Ambiente | Origin | Redirect | `NEXTAUTH_URL` |
|----------|--------|----------|----------------|
| Dev (34827) | `http://127.0.0.1:34827` | `…/aulaChines/api/auth/callback/google` | `http://127.0.0.1:34827/aulaChines` |
| Local Node (34902) | `http://127.0.0.1:34902` | `…/aulaChines/api/auth/callback/google` | `http://127.0.0.1:34902/aulaChines` |
| Produção | `https://webplace.cc` | `…/aulaChines/api/auth/callback/google` | `https://webplace.cc/aulaChines` |

Porta 34901 (estático) não tem OAuth. Portas e URLs:
[04_operacao_local.md](04_operacao_local.md).

## 7. Variáveis de ambiente

```bash
node scripts/sync-env-from-credentials.mjs
```

| Variável | Notas |
|----------|-------|
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Assinatura do JWT |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Cliente ChineseSite |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | One Tap (cliente) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Lista de admins, separada por vírgulas |
| `NEXT_PUBLIC_AUTH_ENABLED` | `0` no export estático |
| `SITE_DB` / `PHRASE_GAME_DB` | Caminho do SQLite |

## 8. Smoke test

```bash
# Sessão anónima → {}
curl -s http://127.0.0.1:34827/aulaChines/api/auth/session

# Convidado consegue jogar: banco servido sem sessão
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:34827/aulaChines/api/phrase-game/bank

# Após login no browser, repetir a 1.ª — deve devolver user com id
```

## 9. Estado

- [x] Auth.js + Google + One Tap
- [x] `SessionProvider` global, `users` (migrado de `players`)
- [x] `getSessionUser` / `requireSession` / `requireCurator`
- [x] Gate do curador (`/registerClass`, `/reviewClass`)
- [x] `LoginGate` em tutor / prática / quiz; `/api/chat` exige sessão
- [x] Jogo de frases jogável sem conta, com telemetria `anonId`
- [ ] Pontuação agregada + histórico por utilizador (Fase 2)
- [ ] Ligar `anon_id` a `user_id` quando o convidado faz login
- [ ] Segundo provedor — ver [16_auth_wechat_roadmap.md](16_auth_wechat_roadmap.md)

*Última revisão: set 2026*
