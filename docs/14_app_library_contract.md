# 14 — Contrato biblioteca app ↔ site

Espelho de `APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md` (implementação neste repo).

**Site = soberano** (SQL + snapshot). **App + widgets = consumidores** do pack — não editam o léxico.

Atualizado: 2026-07-24.

---

## Fonte única

| Consumidor | Fonte SQL |
|------------|-----------|
| Site `/praticar` | `lexico_*` + `context_decks` |
| Snapshot / API / widgets do app | as mesmas tabelas (`lexico_entries` = pool de rotação; sem tabela à parte) |

`lexico_entries` materializa blocos + context decks + `lexicon_global` + **NTCSL level-2 core** (`OrganizeVocabulary_books/level2_NTCSL/lexico-core.json`, ≤3 hanzi, **sem** `book_vocab_*`), só com categoria. Assignments: `web/scripts/lexico-category-assignments.mjs`. Gancho LLM: `src/server/lexico/` + `npm run lexico:classify-llm`.

Artefacto gerado (não é edição): `web/data/app-library/{library,meta}.json`.

---

## API (`build:server` / Node — não no static export)

| Método | Path | Auth |
|--------|------|------|
| `GET` | `/api/app/content/manifest` | `Bearer APP_LIBRARY_TOKEN` |
| `GET` | `/api/app/content/pack/library` | igual |

`library.url` no manifesto inclui basePath (`/aulaChines/...`).

Token: `hanzi_app.APP_LIBRARY_TOKEN` → `sync-env-from-credentials.mjs` → `.env.local` / `deploy/server.env`. Sem token → `503`.

---

## Job

```bash
cd web
npm run build:app-library   # também no fim de seed:content
```

`contentVersion` sobe quando o fingerprint do conteúdo muda (piso > seed offline v1).

---

## Estado

1. [x] SQL → snapshot + API + Bearer  
2. [x] Token local alinhado com o app  
3. [ ] Deploy itcsVM3 (ops — quando autorizares)

---

## Fora deste contrato

- **Lyric Cards / KTV** (`/ktv`) — treino privado de letras (admin); dados em `web/public/ktv/`, não entram no pack do app.

---

## Referências

- App: `~/Projects/APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md`
- Content DB: [11_content_db_schema.md](11_content_db_schema.md)
- Classificação LLM do léxico: [15_lexico_llm_classify_contract.md](15_lexico_llm_classify_contract.md)
