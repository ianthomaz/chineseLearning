# LLM, tutor, RAG e conteúdo

## Tutor no site

UI → **`POST /api/chat`** (Next) → proxy **`/edu/chat`** (API externa) com Bearer token.

Export estático (`out/`) **não** expõe esta rota — precisa `next dev` ou `next start`.

## Onde corre a API

Fora deste repo — Docker `featureLLM` no Mac mini.

| Ambiente | `LLM_API_URL` típico |
|----------|----------------------|
| Dev (Mac com Docker) | `http://127.0.0.1:28471` |
| Node na VM (itcsVM3) | `https://llm.webplace.cc` |

Matriz completa: **ITCS/featureLLM** `docs/MANUAL_INTEGRACAO.md` § 1.1.

## Variáveis (`web/.env.local` / `deploy/server.env`)

| Variável | Uso |
|----------|-----|
| `LLM_API_URL` | Base da API (sem `/` final) |
| `LLM_API_TOKEN` | Bearer — health, chat, ingest |
| `LLM_EDU_CHAT_MODEL` | Opcional; vazio = default `fast` na API |
| `LLM_EDU_CHAT_MODEL_RETRY` | Opcional; modelo no retry se falta JSON estruturado |

Verificação: `cd web && npm run check:llm` · `./start.sh --local` faz health antes de subir.

## Contratos detalhados

Em [`connectLLM/`](../connectLLM/README.md):

- `ACESSO_E_VERIFICACAO.md` — token, health, erros
- `CONTRATO_EDU_COMPLETO.md` — `/edu/chat`, JSON estruturado
- `RAG_PROJETOS_INGEST_ASK.md` — ingest e `/ask`
- `GUIA_LLM_EDU.md` — visão geral

---

## Duas camadas de conteúdo

1. **Site (páginas)** — `Content/` → `parse-consolidado.mjs` → blocos de estudo. Ver [07_conteudo_dados.md](07_conteudo_dados.md).
2. **RAG na API** — `rag_knowledge/` → `POST /ingest`, projeto **`chinese_learning`**.

O tutor usa **`/edu/chat`** hoje; ingest alimenta RAG para `/ask` ou políticas futuras.

### O que vai no RAG

| Ficheiro | Origem |
|----------|--------|
| `generated/jogo-frases.md` | Banco do jogo (`FRASES_GAME/curated/` + pinyin do build) |
| `generated/livros.md` | Léxico curado 初级·上/下 |
| `generated/vocabulario-curso.md` | Consolidado do site |
| `generated/aulas-extra.md` | Cozinha + aulas Confúcio |
| `generated/indice.md` | Mapa da pasta |
| `ordem-alternativas.md` | Quando uma ordem de frase é alternativa válida |
| `vocabulario_estruturas.md`, `extraContent.md`, `dialogos_pratica.md`, `hsk1_interrogatives_pt.md` | Pedagógico HSK1 (à mão) |

Qualquer `.md` extra na raiz de `rag_knowledge/` entra no ingest. Corpora grandes: acrescentar fonte em `scripts/build-rag-knowledge.mjs`.

```bash
cd web && npm run build:rag     # regenera generated/*.md (local, sem API)
cd web && npm run ingest:rag    # POST /ingest — só quando a API local deve reindexar
```

Requisitos Docker/paths: `connectLLM/RAG_PROJETOS_INGEST_ASK.md`.

`./start.sh --local --ingest` ou `--prepare --ingest` — mesmo script após checks.

Deploy **não** faz ingest — correr manualmente quando `rag_knowledge/` mudar.

---

## Classificação léxico (widgets / app)

**Soberano:** SQL no site (`lexico_entries`). **Consumidor:** app iOS + widgets via pack API.

Pipeline:

```
aula/contexto → (LLM classify se preciso) → lexico_entries
  → build:app-library → app + /practice avulso
```

Comandos:

```bash
npm run lexico:pending           # gaps
npm run lexico:classify-llm      # proposta via LLM (review manual)
LEXICO_REBUILD=1 npm run seed:content
```

Código: `web/src/server/lexico/`, `web/scripts/classify-lexico-pending.mjs`.

**Contrato de resposta LLM** (enum de categorias, JSON — não é `/edu/chat`):

- 7 buckets de rotação; palavras ≤3 hanzi; sem `book_vocab_*`
- Pending = sem categoria → fora do pack/widgets
- Endpoint dedicado no orquestrador = backlog; hoje script client-side com mesma URL/token

Pack app: [09_roadmap_integracoes.md](09_roadmap_integracoes.md) § App library.

Espelho app: `APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md`.
