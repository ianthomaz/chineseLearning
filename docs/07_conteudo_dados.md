# Conteúdo editorial e dados

Estado: **SQL = fonte de verdade** (jul 2026). JSON/MD = bootstrap para tabelas vazias.

Schema Prisma: [`web/prisma/schema.prisma`](../web/prisma/schema.prisma) — **alterar schema ⇒ actualizar este doc**.

---

## Editar conteúdo

```bash
cd web
npm run db:studio          # UI Prisma
npm run seed:content       # preenche tabelas VAZIAS
FORCE_RESEED=1 npm run seed:content   # apaga e reimporta
```

`DATABASE_URL` → `web/data/phrase-game.sqlite` (partilhado com phrase game + auth).

### Runtime

| `CONTENT_SOURCE` | Comportamento |
|------------------|---------------|
| omitido / `db` | SQLite (default) |
| `json` | Fallback export estático |

Código: `web/src/lib/content/`

---

## Tabelas principais

| Tabela | Uso |
|--------|-----|
| `content_blocks` (+ filhos) | Blocos `/review`, `/vocabulary`, `/grammar` |
| `phrase_game_phrases` | Jogo de frases |
| `quiz_*` | Gamification |
| `global_dialogue_sections` | Diálogos |
| `visual_pdf_entries` | PDFs em `/visuals` |
| `books` / `book_vocab_entries` | Eixo A — léxico por livro |
| `classes` / `lessons` / … | Eixo B — registo aulas (catálogo `classes` = privado do criador; ver [09](09_roadmap_integracoes.md)) |
| `context_decks` / `context_deck_cards` | Flashcards `/practice` |
| `lexico_*` | Pool partilhado site + app |
| `progress` | Domínio por item e por jogador — ver abaixo |
| `accounts`, `alipay_open_ids`, `app_sessions`, `email_tokens`, `clearance_changes` | Contas (`google`, `apple`, `alipay`=union_id, `email`), mapa Alipay por APPID, sessões do app, links por e-mail, auditoria NOIA — [05](05_autenticacao.md) § Contas |
| `game_rounds` | Uma linha por rodada terminada |

### Progresso do jogador

Só para quem tem sessão. Duas tabelas com trabalhos distintos:

| Tabela | Granularidade | Responde a |
|--------|---------------|-----------|
| `game_rounds` | uma linha por rodada terminada | "como me saí da última vez?" |
| `progress` | uma linha por (`user_id`, `game`, `item_id`) | "o que tenho de rever?" |

`game` discrimina o domínio — os ids de item só são únicos **dentro** de cada
jogo:

| `game` | `item_id` | Origem |
|--------|-----------|--------|
| `phrase` | id da frase (ex. `pg-001`) | jogo de frases |
| `quiz` | id da pergunta do quiz | gamification |
| `hanzi` | id estável do léxico (ex. `1-一`) | Sei / Ainda não no app |

`progress` é um **acumulado**, não um log: `attempts`, `correct`,
`best_score`, `last_score`, `last_correct`, `last_seen_at`. O passo a passo
fica em `events`.

A fila de revisão é `last_correct = 0`, ordenada por `last_seen_at` ascendente —
revê-se primeiro o que está parado há mais tempo, não o que se acabou de errar.

Escrita numa transacção: uma rodada meio gravada corromperia essa fila.

### Contrato — revisão de frases e hanzi (nov 2026)

**Fonte de verdade:** servidor (`progress` + `game_rounds`). Cliente (SwiftData /
fila Android) espelha para offline e sobe quando há sessão.

**Escrita:** `POST /api/game/round` (site cookie ou Bearer do app). Idempotente
por (`user_id`, `round_id`). Mesmo pipeline `RoundSync` do app.

**Ciclo (binário, sem Leitner/SRS nesta fase):**

1. Errar frase / tocar **Ainda não** no hanzi → `last_correct = 0` (entra na fila).
2. Acertar na revisão / tocar **Sei** depois → `last_correct = 1` (sai da fila ativa).
3. `attempts` e `correct` sobem a cada envio; o passo a passo continua em `events`.

**Frases — sync da fila quando logado:** o app pode manter `phraseIdsToReview`
local; após sync, a lista canónica é `itemsToReview(userId, "phrase")` no
servidor (mesmo critério: `last_correct = 0`). Alinhar UI “Rever erradas” a
essa regra — contrato pronto; botão/tela ainda por fazer.

**Hanzi:** hoje Sei/Ainda não no app ainda é memória de sessão / preferência
local. Contrato: passar a gravar via round com `game: "hanzi"`. UI persistida =
próxima rodada.

**Encaixe futuro (só nota):** anotações de estrutura gramatical nas frases
poderão classificar se o erro parece gramática e agrupar pelo mesmo conceito —
sem schema novo nesta fase; quando existir, liga-se ao `item_id` da frase e/ou
a tags de conteúdo, não a uma segunda tabela de “mastery”.

**Exemplos** (fictícios, sem PII):

```json
{
  "game": "phrase",
  "roundId": "r_phrase_20261105_a1",
  "tier": "hsk1",
  "level": 2,
  "items": [
    { "itemId": "pg-001", "correct": false, "score": 0 },
    { "itemId": "pg-002", "correct": true, "score": 1 }
  ]
}
```

```json
{
  "game": "hanzi",
  "roundId": "r_hanzi_20261105_b2",
  "items": [
    { "itemId": "1-一", "correct": false, "score": 0 },
    { "itemId": "1-七", "correct": true, "score": 1 }
  ]
}
```

Depois do primeiro payload, `progress` para (`user`, `phrase`, `pg-001`) tem
`last_correct = 0`; para `pg-002`, `last_correct = 1`. Um segundo round que
mande `pg-001` com `correct: true` tira-o da fila.

**Schema SQLite (runtime):** uma string `MIGRATION` squashed em
`web/src/server/db/index.ts` — shape canónico de `users` (incl. `password_hash`,
`email_verified_at`, `clearance`), `progress` (com `game`), `email_tokens`
(com `password_hash`), etc. Não há pasta `prisma/migrations` para isto.
Helpers idempotentes (`migrateProgressStub`, `migratePlayersToUsers`,
`migrateIdentity`) só actualizam DBs antigos: dobram `players` → `users`,
criam a VIEW `players`, apagam `players_legacy`, e removem `progress_legacy`
vazio. Stub antigo de `progress` com linhas fica como `progress_legacy` até
revisão manual.

### Pendências para pontuação partilhada site + app (nov 2026)

- **Ids do quiz não são estáveis.** O quiz grava `progress.item_id` com o `id`
  posicional da pergunta (`QuizGame.tsx`). Rebuild do `hsk1-quiz-bank.json` em
  2026-11-03 (fontes actuais, após a reestruturação) manteve o mesmo id em só
  **32 de 630** perguntas — o banco commitado está defasado das fontes. Publicar
  esse rebuild faz o progresso de quiz já gravado apontar para perguntas
  erradas. Antes: id estável (ex. hash de tipo + hanzi) e migrar `progress`.
- **Frases no pack do app.** O app embute `phrases.json`; só o léxico tem
  manifest/actualização. Pôr as frases no mesmo pack.
- Backup prod: cron pcVelho `50 2 * * *` BRT → `/backups/chineseLearning/sqlite_daily/`
  (30 dias); deploy exclui `data/*.sqlite*` e `data/*.bak*`.
- Identidade: [05](05_autenticacao.md).

### Usuários

Um usuário (`users`, id interno `u_…`; ids antigos = `sub` do Google) e várias
entradas (`accounts`: google, apple, alipay, email). Tudo que é dele aponta
para `users.id`.

| Tabela | Dono | Apagada com a conta? |
|---|---|---|
| `users` | — | sim |
| `accounts` | user_id | sim |
| `app_sessions` | user_id | sim |
| `email_tokens` | user_id | sim |
| `progress`, `game_rounds` | user_id | sim |
| `events` | user_id (ou anon_id) | **não** — anonimizado (`user_id = NULL`) |
| `clearance_changes` | user_id | **não** — auditoria append-only (NOIA) |
| `lessons` | created_by | **não** — só curador; não excluir conta de curador |

Regras que o código garante:

- Mesma pessoa = mesmo `users.id` só por **e-mail verificado** (Google,
  Apple sem "Hide My Email", link de confirmação). Alipay: e-mail do share
  **não** verifica nem faz merge — união site↔app é por `union_id` ([05](05_autenticacao.md)).
- Senha só entra num usuário quando o link do e-mail é aberto.
- Sessão do site de conta excluída = deslogado; rotas não recriam usuário.
- Rodadas são idempotentes por (`user_id`, `round_id`).

Conhecido, ainda aberto (ordem em [09](09_roadmap_integracoes.md) § Sequência):

| # | Problema | Efeito | Caminho |
|---|---|---|---|
| 1 | Ids do quiz posicionais | progress aponta mal após rebuild | id estável + migrar `progress` |
| 2 | `anon_id` não liga ao user no login | histórico guest órfão | ligar no 1.º login (`events`) |
| 3 | Sem UI "vincular outra conta" / excluir no site | Alipay+Google = 2 users; API delete só | [05](05_autenticacao.md) |
| 4 | Admin por e-mail no env, fora do NOIA | dois sistemas | admin = A7 |
| 5 | `progress_legacy` com linhas (raro) | ruído | inspecionar e dropar |

Consultas úteis (produção, só leitura):

```sql
SELECT clearance, COUNT(*) FROM users GROUP BY clearance;
SELECT provider, COUNT(*) FROM accounts GROUP BY provider;
SELECT source, COUNT(*) FROM clearance_changes GROUP BY source;
-- mesmo e-mail em mais de um usuário (candidatos a "conectar conta")
SELECT lower(email), COUNT(*) FROM users WHERE email IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
```

### Lexico (site + app iOS)

Fontes → `lexico_entries` (≤3 hanzi, com categoria):

1. Vocabulário dos blocos (mapa fixo)
2. Context deck cards (assignments)
3. `lexicon_global` (curador)

`LEXICO_CATEGORY_ASSIGNMENTS` **sobrescreve** o mapa do bloco (uma palavra →
uma categoria). Pool de calendário/clima/semana: categoria `weather`
(“Tempo, clima e calendário”); frases/combinações no deck `tempo_relativo`.

Sem categoria = **pending** (fora dos widgets).

```bash
npm run lexico:pending
npm run lexico:classify-llm
LEXICO_REBUILD=1 npm run seed:content
npm run build:app-library
```

Classificação LLM: [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md) · Pack app: [09_roadmap_integracoes.md](09_roadmap_integracoes.md)

---

## Hanzi — traços e escrita

**Implementado:** modal de traços + jogo de escrita via **Hanzi Writer** (CDN).

- Vocabulário: botão por caractere em `VocabTable` → `HanziStrokeModal`
- Prática: `/practice` → `HanziWritingGame`, flashcards contexto

**Fontes de dados:**

- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) — SVG/ordem de traços (licença Arphic — créditos em `SiteAttributionCredits`)
- [Hanzi Writer](https://hanziwriter.org/) — animação e quiz de escrita

Melhoria futura: mirror local dos JSON (hoje CDN).

---

## Bootstrap editorial

| Pasta | Papel |
|-------|-------|
| `vocabulario/Content/` | `consolidado_final.md` → parse → blocos |
| `vocabulario/FRASES_GAME/curated/` | Frases do jogo |
| `vocabulario/OrganizeVocabulary_books/` | Material de livros (eixo A, separado de aulas) |
| `vocabulario/rag_knowledge/` | Ingest RAG; `generated/` vem de `npm run build:rag` — [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md) |

`predev` / `prebuild` correm seed fill-empty — **não** sobrescrevem edições SQL.

---

## Regras de ouro

- **Não editar** `web/src/data/phrase-game/phrases.json` — gerado por `vocabulario/FRASES_GAME/curated/`
- **Sem busca global** no site — decisão de produto fixa
- Alterar `schema.prisma` ⇒ actualizar **este doc**
