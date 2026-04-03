# Arquitetura do repositório

## Raiz

| Caminho | Função |
|---------|--------|
| `start.sh` | Orquestra health LLM, verificação do projeto `chinese_learning`, ingest opcional e modo `--local` ou `--webplace` |
| `web/` | Aplicação Next.js (site, tutor, API route de chat) |
| `connectLLM/` | Documentação e scripts de integração com a API LLM (ingest, contratos) |
| `Content/` | Fonte editorial (ex.: `consolidado_final.md`) processada em build |
| `rag_knowledge/` | Markdown para RAG (`POST /ingest`, projeto `chinese_learning`) |

## Aplicação `web/`

- **Framework:** Next.js com `basePath` **`/aulaChines`** em builds “servidor” e export estático (`NEXT_PUBLIC_BASE_PATH`).
- **Produção local / servidor:** `npm run start:server` usa **`scripts/start-server-stripped.mjs`**, que remove o prefixo do pedido HTTP antes de delegar ao handler do Next — o `next start` em bruto com este `basePath` não servia `/aulaChines/...` (rotas e `/_next/static` ficavam inacessíveis com o URL público).
- **Dois modos de build:**
  - **`build:server`** — sem `output: export`; inclui Route Handlers (ex. proxy do chat).
  - **`build:webplace`** — `NEXT_STATIC_EXPORT=1`; gera `out/` para nginx ou `python -m http.server` (sem API de chat no Next).

## Pré-build de conteúdo

Os scripts `predev` e `prebuild` correm **`scripts/parse-consolidado.mjs`**, que lê `Content/` e alimenta dados usados pelas páginas (ex. lições, vocabulário).

## API do tutor

O chat do tutor usa **`POST /aulaChines/api/chat`** (prefixo do `basePath`). O Route Handler faz proxy para a API LLM (URL e token em variáveis de ambiente). Detalhes do contrato HTTP em [03_llm.md](03_llm.md) e em `connectLLM/CONTRATO_EDU_COMPLETO.md`.

## Papel de `connectLLM/`

Não é um serviço em execução contínua no repo: é **documentação** e **scripts** (ex. `ingest-chinese-learning.sh`) invocados a partir de `web/package.json` (`npm run ingest:rag`).
