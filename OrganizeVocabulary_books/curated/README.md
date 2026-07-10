# Curated lexicon

Léxico dos PDFs **新时代汉语口语** 初级·上 / 初级·下 — revisão supervisionada lição a lição.

Esta pasta é a **única parte** de `OrganizeVocabulary_books/` versionada no git.

## Estrutura de cada lição

`{book}/lesson-{NN}.json`

Duas vistas do mesmo léxico:

1. **`byLessonSource`** — como o livro apresenta (`text`, `extension`, `produce`)
2. **`byPos`** — agrupamento por classe gramatical (`verb`, `noun`, `adjective`, …)

## Categorias (`byPos`)

| Chave | Livro (POS) |
|-------|-------------|
| `verb` | 动 |
| `noun` | 名 |
| `adjective` | 形 |
| `adverb` | 副 |
| `measureWord` | 量 |
| `conjunction` | 连 |
| `interjection` | 叹 |
| `pronoun` | 代 |
| `preposition` | 介 |
| `properNoun` | 专有 / nomes próprios |
| `produceOnly` | só em 任务支持, sem entrada completa na lição |

Mapa completo: `_pos-map.json`.

## Estado

| Livro | Lições |
|-------|--------|
| `primary-up` (初级·上) | 16 / 16 |
| `primary-down` (初级·下) | 16 / 16 |

Detalhe: `progress.json` · índice merged: `lexicon-by-book.json` (~594 entradas).
