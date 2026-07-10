# Conteúdo editorial em BD — schema e migração

Estado: **runtime BD** (jul 2026). O site serve conteúdo via SQLite (`CONTENT_SOURCE=db` por defeito). JSON/MD continuam como fonte de edição humana + input do seed.

Ver também: [02_arquitetura.md](02_arquitetura.md), [09_google_auth_jogo.md](09_google_auth_jogo.md), [12_aula_registro_roadmap.md](12_aula_registro_roadmap.md).

---

## Alternar fonte de conteúdo

| Variável | Valor | Comportamento |
|----------|-------|---------------|
| *(omitida)* | `db` | SQLite (`SITE_DB` / `web/data/phrase-game.sqlite`) |
| `CONTENT_SOURCE=db` | `db` | Igual |
| `CONTENT_SOURCE=json` | `json` | Fallback: `consolidado.json` + loaders JSON (static export / emergência) |

Código: [`web/src/lib/content/`](../web/src/lib/content/) — `ContentRepository`, `json-repository.ts`, `sql-repository.ts`.

Seed: `cd web && npm run seed:content` ([`scripts/seed-content-db.mjs`](../web/scripts/seed-content-db.mjs)).

---

## Separação: utilizadores vs conteúdo

| BD / tabela | Fase | Ficheiro SQLite |
|-------------|------|-----------------|
| `users`, `events`, `progress` | Feito | `web/data/phrase-game.sqlite` |
| Tabelas editoriais / jogos / livros | Feito | Mesmo ficheiro |

---

## Schema (conteúdo)

Espelha [`ContentBlock`](../web/src/lib/blocks-types.ts) e fontes actuais. Definido em [`web/src/server/db/index.ts`](../web/src/server/db/index.ts) `MIGRATION`.

| Tabela | Uso |
|--------|-----|
| `content_blocks` (+ filhos normalizados + `payload_json`) | Blocos de estudo |
| `phrase_game_phrases` | Banco do phrase game |
| `quiz_bank_meta` / `quiz_questions` | Gamification |
| `global_dialogue_sections` | Página diálogos |
| `visual_pdf_entries` | Catálogo Visuais (PDFs no disco) |
| `books` / `book_vocab_entries` | Eixo A — léxico por capítulo |
| `classes` / `lessons` / … | Eixo B — registo de aulas |

---

## Import / seed

```bash
cd web
npm run prebuild:phrase-game   # se phrases.json desactualizado
node scripts/parse-consolidado.mjs
npm run seed:content
```

Ordem no seed: editorial → phrases → quiz → dialogues → visuals → books.

`predev` / `prebuild` / `build:server` correm o seed automaticamente.

---

## Checklist

1. [x] `ContentRepository` + `JsonRepository`
2. [x] Schema SQL no `MIGRATION`
3. [x] Import consolidado → SQLite
4. [x] `SqlContentRepository` + `CONTENT_SOURCE=db` default
5. [x] Phrases / dialogues / quiz / visuals via BD
6. [x] `books` / `book_vocab_entries` + API sugestão
7. [x] JSON deixa de ser lido em runtime (excepto fallback `CONTENT_SOURCE=json`)

*Última revisão: jul 2026*
