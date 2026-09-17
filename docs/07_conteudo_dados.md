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
| `context_decks` / `context_deck_cards` | Flashcards `/praticar` |
| `lexico_*` | Pool partilhado site + app |

### Lexico (site + app iOS)

Fontes → `lexico_entries` (≤3 hanzi, com categoria):

1. Vocabulário dos blocos (mapa fixo)
2. Context deck cards (assignments)
3. `lexicon_global` (curador)

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
- Prática: `/praticar` / `/randomhanzi` → `HanziWritingGame`, flashcards contexto

**Fontes de dados:**

- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) — SVG/ordem de traços (licença Arphic — créditos em `SiteAttributionCredits`)
- [Hanzi Writer](https://hanziwriter.org/) — animação e quiz de escrita

Melhoria futura: mirror local dos JSON (hoje CDN).

---

## Bootstrap editorial

| Pasta | Papel |
|-------|-------|
| `Content/` | `consolidado_final.md` → parse → blocos |
| `FRASES_GAME/curated/` | Frases do jogo |
| `OrganizeVocabulary_books/` | Material de livros (eixo A, separado de aulas) |
| `rag_knowledge/` | Ingest RAG; `generated/` vem de `npm run build:rag` — [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md) |

`predev` / `prebuild` correm seed fill-empty — **não** sobrescrevem edições SQL.

---

## Regras de ouro

- **Não editar** `web/src/data/phrase-game/phrases.json` — gerado por `FRASES_GAME/curated/`
- **Sem busca global** no site — decisão de produto fixa
- Alterar `schema.prisma` ⇒ actualizar **este doc**
