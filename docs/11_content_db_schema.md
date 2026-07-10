# Conteúdo editorial em BD — schema e migração

Estado: **preparação** (jul 2026). O site continua a servir conteúdo via JSON em build (`CONTENT_SOURCE=json` por defeito). Este documento descreve o caminho para `CONTENT_SOURCE=db`.

Ver também: [02_arquitetura.md](02_arquitetura.md), [09_google_auth_jogo.md](09_google_auth_jogo.md) (utilizadores em `users`).

---

## Alternar fonte de conteúdo

| Variável | Valor | Comportamento |
|----------|-------|---------------|
| *(omitida)* | `json` | `consolidado.json` + build scripts (actual) |
| `CONTENT_SOURCE=json` | `json` | Igual |
| `CONTENT_SOURCE=db` | `db` | **Não implementado** — `getContentRepository()` falha até existir import |

Código: [`web/src/lib/content/`](../web/src/lib/content/) — interface `ContentRepository`, implementação `json-repository.ts`.

---

## Separação: utilizadores vs conteúdo

| BD / tabela | Fase | Ficheiro SQLite |
|-------------|------|-----------------|
| `users`, `events`, `progress` | **Fase 1 — feito** | `web/data/phrase-game.sqlite` (env `SITE_DB` ou `PHRASE_GAME_DB`) |
| Tabelas abaixo | **Fase 2 — futuro** | Mesmo ficheiro ou `site.sqlite` dedicado |

Utilizadores **não** misturar com blocos editoriais — FK futura `lesson_sessions.user_id → users.id`.

---

## Schema proposto (conteúdo editorial)

Espelha [`ContentBlock`](../web/src/lib/blocks.ts) e fontes actuais.

### `content_blocks`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | INTEGER PK | Mesmo id do consolidado (1–16, …) |
| `title` | TEXT | |
| `narrative` | TEXT | Markdown ou texto simples |
| `sort_order` | INTEGER | Ordem na navegação |

### `vocab_entries`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | INTEGER PK AUTO | |
| `block_id` | INTEGER FK | → `content_blocks.id` |
| `hanzi` | TEXT | |
| `pinyin` | TEXT | |
| `translation` | TEXT | PT (legado); i18n futuro em tabela à parte |
| `sort_order` | INTEGER | |

### `structure_lines`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | INTEGER PK AUTO | |
| `block_id` | INTEGER FK | |
| `hanzi` | TEXT | |
| `pinyin` | TEXT | |
| `sort_order` | INTEGER | |

### `structure_glosses`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `structure_id` | INTEGER FK | → `structure_lines.id` |
| `locale` | TEXT | `pt` \| `en` \| `es` |
| `gloss` | TEXT | Uma linha por gloss |

### `block_notes`, `block_differences`, `block_priorities`

| Coluna | Tipo |
|--------|------|
| `id` | INTEGER PK AUTO |
| `block_id` | INTEGER FK |
| `body` | TEXT |
| `sort_order` | INTEGER |

### `dialogue_turns` + `dialogue_conversations`

Mini-diálogos de revisão — conversa = grupo ordenado de turnos (`speaker`, `hanzi`, `pinyin`, traduções por locale em JSON ou tabela `dialogue_translations`).

### `phrase_game_phrases`

Espelha [`FRASES_GAME/schema.json`](../FRASES_GAME/schema.json) — import desde `phrases.json` ou pipeline `curated/`.

### `quiz_questions`

Espelha `hsk1-quiz-bank.json` — gamification.

### `global_dialogues`

Espelha `global-dialogues.json` + extra.

### Feature aulas — ver [12_aula_registro_roadmap.md](12_aula_registro_roadmap.md)

Eixo B **implementado** no `MIGRATION` de [`web/src/server/db/index.ts`](../web/src/server/db/index.ts)
(criadas em BDs existentes via `CREATE TABLE IF NOT EXISTS`; `classes` com seed `INSERT OR IGNORE`).
Eixo A (livros) continua **reservado**.

| Tabela | Estado | Uso |
|--------|--------|-----|
| `classes` | ✅ MIGRATION | Config seed: Confúcio B1/B2, Prepely, X-Mandarin T3/Privado |
| `lessons` | ✅ MIGRATION | Registo por **aula** real (data, classe, notas, `created_by → users.id`) |
| `lesson_material_refs` | ✅ MIGRATION | Livro + **capítulo** (0..N por aula), `ON DELETE CASCADE` |
| `lesson_vocab_items` | ✅ MIGRATION | Palavras da aula (hanzi, pinyin, translation, notes, theme), `ON DELETE CASCADE` |
| `lexicon_global` | ✅ MIGRATION | Léxico acumulado (chave = hanzi **exacto**; upsert ao salvar; não apaga ao remover da aula) |
| `books` | Reservado | `primary-up`, `primary-down` |
| `book_vocab_entries` | Reservado | Léxico por **capítulo** do livro (import `OrganizeVocabulary_books/`) |

---

## Import inicial (futuro)

1. Script one-shot: `Content/consolidado_final.md` + `review_extras.md` → SQLite (equivalente a [`parse-consolidado.mjs`](../web/scripts/parse-consolidado.mjs)).
2. `FRASES_GAME/curated/` → `phrase_game_phrases`.
3. Activar `SqlContentRepository` em `web/src/lib/content/sql-repository.ts` (server-only).
4. Páginas Next: deixar de depender só de `generateStaticParams` + JSON; passar a `dynamic` ou ISR com repository.

**Consequência:** `build:webplace` deixa de ser viável para conteúdo dinâmico — alinhado com produção `build:server` em itcsVM3.

---

## Ordem sugerida

1. [x] `ContentRepository` + `JsonRepository` (prep)
2. [ ] Documentar e validar schema SQL (este ficheiro)
3. [ ] Import consolidado → SQLite
4. [ ] `CONTENT_SOURCE=db` em dev
5. [ ] Descontinuar `prebuild` de conteúdo editorial quando BD for fonte única

*Última revisão: jul 2026*
