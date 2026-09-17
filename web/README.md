This is a [Next.js](https://nextjs.org) project for **Learn Chinese** — **https://learnchinese.today/**

**Documentação:** [`../docs/01_readme.md`](../docs/01_readme.md) · **Operação e deploy:** [`../docs/03_operacao_e_deploy.md`](../docs/03_operacao_e_deploy.md)

## Tutor / LLM

**`POST /api/chat`** → proxy **`/edu/chat`**. Export estático não inclui API — ver [`../docs/04_llm_conteudo_rag.md`](../docs/04_llm_conteudo_rag.md).

- API: Docker `featureLLM`, porta 28471 (Mac) ou **`https://llm.webplace.cc`** (VM)
- Token: `LLM_API_TOKEN` em `web/.env.local`
- Ingest RAG: `npm run build:rag` (markdown local) · `npm run ingest:rag` (API)

## PDFs (`pdf-content/`)

`prebuild` copia para `public/downloads/`. Lista no site: **`/visuals`**.

## Deploy (itcsVM3)

| Passo | Comando |
|-------|---------|
| ENV | `node scripts/sync-env-from-credentials.mjs` |
| Build | `./start.sh --prod` |
| Upload | `./start.sh --prod --upload` |

Nginx: `deploy/nginx-learnchinese.conf.example` → ver `deploy/README.md`.

Estático local: `npm run deploy:local` · Node local: `npm run deploy:local:live`
