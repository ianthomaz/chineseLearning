This is a [Next.js](https://nextjs.org) project for the Chinese Learning site.

## Local dev (site + tutor LLM)

O tutor chama **`POST …/api/chat`**, que faz proxy para **`/edu/chat`** na API externa. Isto **não** existe no export estático (`out/`); precisas de **`npm run dev`** ou de **`next start`** após `npm run build:server`.

1. **API LLM** — Docker em **`~/Documents/ITCS/featureLLM`**, porta **28471**. Verificação rápida: `npm run check:llm` (lê `.env` + `.env.local`).

2. **Token** — **`LLM_API_TOKEN`** em **`ITCS/featureLLM/.env`**. No site: **`web/.env.local`** (gitignored), igual ao da API; **`web/.env`** traz só o default de `LLM_API_URL`.

3. **RAG** — `ITCS/featureLLM/docs/CHINESE_LEARNING_PROJECT.md` + `CHINESE_LEARNING_SOURCES` no `featureLLM/.env`.

4. **Next em dev** (porta **34827**):

   ```bash
   npm run check:llm   # opcional
   npm run dev
   ```

   Tutor: [http://127.0.0.1:34827/tutor](http://127.0.0.1:34827/tutor).

5. **Produção local (como no servidor)** — mesmo código que em webplace com `basePath` `/aulaChines`:

   ```bash
   npm run build:server
   PORT=34828 npm run start:server
   ```

   Tutor: [http://127.0.0.1:34828/aulaChines/tutor](http://127.0.0.1:34828/aulaChines/tutor) (usa `server.env` / `.env.local` para `LLM_*`).

5. **RAG (ingest)** — o chat do tutor usa **`/edu/chat`** (eixo educacional), não `/ask`. Para indexar `rag_knowledge/` na biblioteca vetorial da mesma API (perguntas com RAG no futuro):

   ```bash
   npm run ingest:rag
   ```

   Isto corre `connectLLM/ingest-chinese-learning.sh`, que lê `web/.env.local` e faz `POST …/ingest` com `project_id: chinese_learning`. O caminho em `sources` tem de existir **no processo da API** (no Docker, monta o repo ou define `RAG_SOURCES_PATH` — ver [`connectLLM/RAG_PROJETOS_INGEST_ASK.md`](../connectLLM/RAG_PROJETOS_INGEST_ASK.md)).

**Requisitos extra para ingest:** `jq` instalado (`brew install jq`).

## Docs LLM

- [`connectLLM/README.md`](../connectLLM/README.md) — índice
- [`connectLLM/CONTRATO_EDU_COMPLETO.md`](../connectLLM/CONTRATO_EDU_COMPLETO.md) — `/edu/chat`, formato `reply_structured`

## Preview estático (como webplace `/aulaChines/`)

Só HTML estático — **sem tutor** (não há `POST /api/chat`):

```bash
npm run preview:webplace
```

Porta **34827**; para o `npm run dev` antes se essa porta estiver ocupada.

## Deploy

### A) Estático (`out/` → nginx `alias`)

Só páginas; **tutor não funciona**.

- `npm run deploy:webplace` — rsync para `itcsVM:/home/opc/projetos/chineseLearning` (ver script).
- `npm run deploy:local` — cópia para `/tmp/chineseLearning-webplace-out` ou `DEPLOY_LOCAL_DIR`.
- `deploy/server.env` + `DEPLOY_PUSH_SERVER_ENV=1` — envia `server.env` junto (documentação / ingest noutra máquina).

### B) Node (`next start`) — site + tutor

1. `cp deploy/server.env.example deploy/server.env` e preenche `LLM_*`.
2. `npm run deploy:node` — rsync do código, `scp server.env`, no remoto `npm ci` + `npm run build:server`.
3. No servidor, processo permanente, por exemplo:

   ```bash
   cd …/chineseLearning-app && set -a && source ./server.env && set +a && PORT=34827 npm run start:server
   ```

4. **Nginx** — proxy para o Node (mantém o prefixo `/aulaChines`):

   ```nginx
   location /aulaChines/ {
     proxy_pass http://127.0.0.1:34827;
     proxy_http_version 1.1;
     proxy_set_header Host $host;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
   ```

   Ajusta `34827` a `DEPLOY_NODE_PORT` / `PORT` se mudares.

Overrides: comentários em `scripts/deploy-webplace.sh` e `scripts/deploy-node.sh`.

---

Legacy `create-next-app` boilerplate below (Vercel, etc.) pode ser ignorado para este projeto.
