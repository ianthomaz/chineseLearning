# Arquitetura do repositório

## Raiz

| Caminho | Função |
|---------|--------|
| `web/` | Site Next.js — learnchinese.today |
| `appMobile/` | Apps iOS + Android (submodule APP_learnChineseToday) — `ios/`, `android/` |
| `vocabulario/` | Léxico / frases / bootstrap editorial / RAG sources |
| `docs/` | Documentação (`docs/llm/` = contratos API LLM) |
| `scripts/` | Scripts de build/ingest na raiz |
| `QA/` | Smoke / Playwright / Lighthouse |
| `local/` | Credenciais (gitignored) |
| `ianthomaz/` | Avulsas pessoais — fora do produto |
| `start.sh` | Dev / local / prod |
| `itcsManifest.yaml` | Cartão ITCS |

Dentro de `vocabulario/`: `Content/`, `FRASES_GAME/`, `OrganizeVocabulary_books/`, `rag_knowledge/`, JSONs de léxico.

## Aplicação `web/`

- **URL:** `https://learnchinese.today/` — `NEXT_PUBLIC_BASE_PATH` vazio
- **Framework:** Next.js 15 · React 19
- **Produção:** `npm run start:server` → nginx → `127.0.0.1:34827`

### Dois builds

| Script | Output | API / auth |
|--------|--------|------------|
| `build:server` | `.next/` | Sim — tutor, OAuth, SQLite |
| `build:webplace` | `out/` estático | Não — guest only |

Rotas dinâmicas: extensão **`route.server.ts`** / `page.server.tsx` (ficam fora do export).
Um `route.ts` com `force-dynamic` **parte** o `build:webplace`.

## Rotas principais

| Rota | O quê | Login |
|------|-------|:-----:|
| `/` | Home | — |
| `/review`, `/vocabulary`, `/grammar` | Blocos de estudo | — |
| `/dialogues`, `/visuals` | Diálogos, PDFs | — |
| `/phrase-game` | Jogo de frases | — |
| `/practice` | Escrita + flashcards | sim |
| `/tutor` | Chat LLM | sim |
| `/gamification` | Quiz HSK1 | sim |
| `/ktv` | Letras | — |
| `/registerClass`, `/reviewClass` | Curador — aulas | curador |
| `/backoffice` | Telemetria jogo | admin |

Gates: [05_autenticacao.md](05_autenticacao.md).

## Pré-build

- `parse-consolidado.mjs` — `vocabulario/Content/` → JSON blocos
- `build-phrase-game-data.mjs` — `vocabulario/FRASES_GAME/` → SQLite + `phrases.json`
- `seed-content-db.mjs` — bootstrap SQL

## Fluxos principais

| Feature | Doc |
|---------|-----|
| Portas, deploy | [03_operacao_e_deploy.md](03_operacao_e_deploy.md) |
| Tutor / LLM | [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md) |
| Auth | [05_autenticacao.md](05_autenticacao.md) |
| Jogo frases | [06_jogo_frases.md](06_jogo_frases.md) |
| BD conteúdo | [07_conteudo_dados.md](07_conteudo_dados.md) |

## `docs/llm/`

Contratos API LLM. Ingest: `scripts/ingest-chinese-learning.sh` (`npm run ingest:rag`).
