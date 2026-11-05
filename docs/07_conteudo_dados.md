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

`game` é `'phrase'` ou `'quiz'` — os ids de item só são únicos dentro de cada
jogo. `progress` é um **acumulado**, não um log: `attempts`, `correct`,
`best_score`, `last_score` e `last_correct`. O passo a passo fica em `events`.

A fila de revisão é `last_correct = 0`, ordenada por `last_seen_at` ascendente —
revê-se primeiro o que está parado há mais tempo, não o que se acabou de errar.

Escrita numa transacção: uma rodada meio gravada corromperia essa fila.

**Migração:** `progress` existia como stub documentado (`user_id`, `phrase_id`,
`score`) que nunca foi escrito. `migrateProgressStub()` em `server/db/index.ts`
substitui-o; se por acaso tiver linhas, guarda-as como `progress_legacy` em vez
de apagar.

### Pendências para pontuação partilhada site + app (nov 2026)

- **Ids do quiz não são estáveis.** O quiz grava `progress.item_id` com o `id`
  posicional da pergunta (`QuizGame.tsx`). Rebuild do `hsk1-quiz-bank.json` em
  2026-11-03 (fontes actuais, após a reestruturação) manteve o mesmo id em só
  **32 de 630** perguntas — o banco commitado está defasado das fontes. Publicar
  esse rebuild faz o progresso de quiz já gravado apontar para perguntas
  erradas. Antes: id estável (ex. hash de tipo + hanzi) e migrar `progress`.
- ~~`game_rounds.round_id` não é único~~ — resolvido em código: `recordRound()`
  ignora um `round_id` que o usuário já tem (índice `idx_rounds_user_round`).
- **Backup do SQLite de produção** não está documentado. Com progresso de
  usuários entre aparelhos, passa a ser obrigatório. (O deploy já preserva o
  SQLite remoto — o rsync exclui `*.sqlite`.)
- **Frases no pack do app.** O app embute `phrases.json` (cópia de
  `src/data/phrase-game/phrases.json`, `Scripts/sync-phrases-seed.mjs`); só o
  léxico tem manifest/actualização. Pôr as frases no mesmo pack.
- Identidade multi-provedor (`accounts`): [05](05_autenticacao.md) § Roadmap.

### Usuários — revisão do banco (nov 2026)

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
  Apple sem "Hide My Email", link de confirmação; Alipay quando devolve e-mail —
  ver pergunta 7 em [05](05_autenticacao.md)).
- Senha só entra num usuário quando o link do e-mail é aberto.
- Sessão do site de conta excluída = deslogado; rotas não recriam usuário.
- Rodadas são idempotentes por (`user_id`, `round_id`).

Conhecido, ainda aberto (ordem em [09](09_roadmap_integracoes.md) § Sequência):

| # | Problema | Efeito | Caminho |
|---|---|---|---|
| 1 | **Sem backup** do SQLite de produção | perder o arquivo = perder todas as contas | cópia diária (`sqlite3 .backup`) para fora da VM, guardar 30 dias |
| 2 | Ids do quiz posicionais | progresso de quiz aponta para a pergunta errada após rebuild | id estável (tipo + hanzi) + migrar `progress` |
| 3 | `users.email` sem índice por `lower(email)` | buscas de junção leem a tabela toda | índice quando passar de alguns milhares |
| 4 | `anon_id` do convidado não liga ao usuário no login | histórico de convidado fica órfão | ligar no primeiro login (só `events`) |
| 5 | Sem "conectar outra conta" | Alipay sem e-mail + Google = 2 usuários | UI com sessão ativa |
| 6 | Excluir conta só pela API/app | site não tem botão | UI |
| 7 | Tabelas legadas `players_legacy`, `progress_legacy` (se existirem) | nenhum | apagar depois do backup |
| 8 | Admin por e-mail (`NEXT_PUBLIC_ADMIN_EMAIL`), fora do NOIA | dois sistemas de permissão | admin = A7 em `users.clearance` |

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
