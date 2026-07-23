# Conteúdo editorial em BD — schema e migração

Estado: **SQL = fonte de verdade** (jul 2026). Edição via Prisma Studio / SQL. JSON/MD são **bootstrap** (só preenchem tabelas vazias).

Ver também: [02_arquitetura.md](02_arquitetura.md), [09_google_auth_jogo.md](09_google_auth_jogo.md), [12_aula_registro_roadmap.md](12_aula_registro_roadmap.md).

---

## Editar conteúdo

```bash
cd web
npm run db:studio          # UI Prisma sobre phrase-game.sqlite
# ou: sqlite3 data/phrase-game.sqlite
```

`DATABASE_URL` (em `web/.env`) aponta para o mesmo ficheiro que `SITE_DB` / `web/data/phrase-game.sqlite`.  
Path relativo ao schema: `file:../data/phrase-game.sqlite`.

Schema tipado: [`web/prisma/schema.prisma`](../web/prisma/schema.prisma).  
Runtime legado (`getDb()` / `node:sqlite`) e Prisma partilham o mesmo SQLite.

---

## Alternar fonte de conteúdo (runtime)

| Variável | Valor | Comportamento |
|----------|-------|---------------|
| *(omitida)* | `db` | SQLite |
| `CONTENT_SOURCE=db` | `db` | Igual |
| `CONTENT_SOURCE=json` | `json` | Fallback static export / emergência (bootstrap JSON) |

Código: [`web/src/lib/content/`](../web/src/lib/content/).

---

## Seed / bootstrap

```bash
cd web
npm run seed:content                 # só preenche tabelas VAZIAS
FORCE_RESEED=1 npm run seed:content  # apaga e reimporta a partir do bootstrap
```

Ordem: editorial → phrases → quiz → dialogues → visuals → books → **context decks** → **lexico**.

`predev` / `prebuild` correm o seed (modo fill-empty) — **não** sobrescreve edições SQL.

---

## Schema (conteúdo)

| Tabela | Uso |
|--------|-----|
| `content_blocks` (+ filhos + `payload_json`) | Blocos de estudo |
| `phrase_game_phrases` | Phrase game |
| `quiz_bank_meta` / `quiz_questions` | Gamification |
| `global_dialogue_sections` | Diálogos |
| `visual_pdf_entries` | Visuais (PDFs no disco) |
| `books` / `book_vocab_entries` | Eixo A — léxico por capítulo |
| `classes` / `lessons` / … | Eixo B — registo de aulas |
| `context_decks` / `context_deck_cards` | Flashcards em contexto (`/praticar`) |
| `lexico_rotation_categories` / `lexico_entries` | Biblioteca partilhada APP Hanzi Memorize |

## Fonte única (prática + app)

| Consumidor | Fonte |
|------------|--------|
| Site `/praticar` (avulso + contexto) | `lexico_*` + `context_decks` |
| Snapshot app (`build:app-library`) | as mesmas tabelas |
| Estudo `/review` `/vocabulary` … | `content_blocks` (currículo — outro eixo) |

`lexico_*` materializa-se a partir de `vocab_entries` só se vazio (`LEXICO_REBUILD=1` força). Não se importa `APP_hanziMemorize/lexico.json`.

Snapshot app: `npm run build:app-library` → `data/app-library/` — ver [14_app_library_contract.md](14_app_library_contract.md).

DDL também em [`web/src/server/db/index.ts`](../web/src/server/db/index.ts) `MIGRATION` (CREATE IF NOT EXISTS).

---

## Checklist

1. [x] `ContentRepository` + SQL default
2. [x] Prisma schema + Studio
3. [x] Seed fill-empty (SQL SoT)
4. [x] Context decks no SQL
5. [x] Lexico (app) no SQL
6. [x] API `manifest` + `pack/library` + Bearer (`APP_LIBRARY_TOKEN`)

*Última revisão: jul 2026*
