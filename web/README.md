This is a [Next.js](https://nextjs.org) project for the Chinese Learning site.

**Documentação geral (índice numerado):** [`../docs/01_readme.md`](../docs/01_readme.md).

## `start.sh` (raiz do repositório `chineseLearning/`)

Orquestra **health da API**, verificação do projeto **`chinese_learning`** em `/projects`, **`--ingest`** opcional, e deploy:

- **`./start.sh --local`** — `build:server` + `npm run start:server` na **34902**; **tutor chama a LLM** via `LLM_API_URL` em **`web/.env.local`** (Docker **`http://127.0.0.1:28471`** ou **`https://llm.webplace.cc`** — mesmo token). Site: `http://127.0.0.1:34902/aulaChines/tutor`
- **`./start.sh --webplace`** — só export estático + Python em **34901**; **não** há `/api/chat` (não testa LLM ao arrancar). Equivalente: **`npm run deploy:local`**
- **`npm run deploy:local:with-api`** — igual a **`deploy:local:live`**: build servidor + Next na **34902** com tutor (precisa **`web/.env.local`**)
- **`./start.sh --prepare`** — valida **`web/deploy/server.env`** (env de produção no disco; template **`deploy/server.env.example`**) + health LLM + **`npm run build:server`** + teste final **`POST /edu/chat`** (omitir com **`START_SKIP_EDU_SMOKE=1`**); **não** inicia servidor nem mexe em portas
- **`npm run remote:handshake`** (em `web/`) — SSH para o host de deploy: **`/health`** + **`POST /edu/chat`** usando `server.env` na VM (ver `scripts/remote-prod-handshake.sh`)
- **`./start.sh --local --ingest`** — checks + fila de ingest + sobe o site com API
- **`./start.sh --local --skip-build`** — só reinicia o Node (usa `.next` existente)

`./start.sh --help` para todas as opções. **`--local`** e **`deploy:local:with-api`** exigem **`web/.env.local`** (token; URL opcional). **`--webplace`** não precisa de token. Em host partilhado: **`--no-kill-port`** ou **`START_NO_KILL_PORT=1`**.

## Local dev (site + tutor LLM)

O tutor chama **`POST …/api/chat`**, que faz proxy para **`/edu/chat`** na API externa. Isto **não** existe no export estático (`out/`); precisas de **`npm run dev`** ou de **`npm run start:server`** após `npm run build:server` (não uses `next start` em bruto com `basePath` — ver `scripts/start-server-stripped.mjs`).

1. **API LLM** — Docker em **`~/Documents/ITCS/featureLLM`**, porta **28471** no Mac. Em **servidor/VM**, o Next deve chamar a API por **URL alcançável** (típico **`https://llm.webplace.cc`**) — ver **`ITCS/featureLLM/docs/MANUAL_INTEGRACAO.md`** § 1.1; **`web/deploy/server.env`** no deploy. Verificação rápida: `npm run check:llm` (lê `.env` + `.env.local`).

2. **Token** — **`LLM_API_TOKEN`** em **`ITCS/featureLLM/.env`**. No site: **`web/.env.local`** (gitignored), igual ao da API; **`web/.env`** traz o default local de **`LLM_API_URL`** (`http://127.0.0.1:28471`).

3. **RAG** — `ITCS/featureLLM/docs/CHINESE_LEARNING_PROJECT.md` + `CHINESE_LEARNING_SOURCES` no `featureLLM/.env`.

4. **Next em dev** (porta **34827**, **`basePath` `/aulaChines`** — igual à produção local; **hot reload** ao guardar):

   ```bash
   npm run check:llm   # opcional
   npm run dev
   ```

   Site: [http://127.0.0.1:34827/aulaChines](http://127.0.0.1:34827/aulaChines) · Tutor: [http://127.0.0.1:34827/aulaChines/tutor](http://127.0.0.1:34827/aulaChines/tutor).

   Sem `basePath` (URLs na raiz): `npm run dev:plain`.

5. **Produção local (como no servidor)** — mesmo código que em webplace com `basePath` `/aulaChines`:

   ```bash
   npm run build:server
   PORT=34828 npm run start:server
   ```

   Tutor: [http://127.0.0.1:34828/aulaChines/tutor/](http://127.0.0.1:34828/aulaChines/tutor/) (usa `server.env` / `.env.local` para `LLM_*`). Alternativa: **`../start.sh --local`** na raiz do repo.

6. **RAG (ingest)** — o chat do tutor usa **`/edu/chat`** (eixo educacional), não `/ask`. Para indexar `rag_knowledge/` na biblioteca vetorial da mesma API (perguntas com RAG no futuro):

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
- `npm run deploy:local` — cópia para `/tmp/chineseLearning-webplace-out` ou `DEPLOY_LOCAL_DIR` (**só HTML**; tutor **não** chama a LLM).
- `npm run deploy:local:live` — `build:server` + `next start` na porta **34902** (ou `PORT=…`); **site + `/aulaChines/api/chat` + tutor** com `.env.local` (`LLM_API_TOKEN`). Para quando quiseres espelhar o deploy “com API” na mesma máquina.
- `deploy/server.env` + `DEPLOY_PUSH_SERVER_ENV=1` — envia `server.env` junto (documentação / ingest noutra máquina).

### B) Node (`next start`) — site + tutor

1. `cp deploy/server.env.example deploy/server.env` e preenche `LLM_*` (e opcionalmente `PORT`, `HOSTNAME=127.0.0.1` — ver comentários no example).
2. Localmente, antes de enviar: **`../../start.sh --prepare`** na raiz do repo (opcional **`--ingest`**) para confirmar env + build sem arrancar nada.
3. `npm run deploy:node` — rsync do código, `scp server.env`, no remoto `npm ci` + `npm run build:server`.
4. No servidor, processo permanente, por exemplo:

   ```bash
   cd …/chineseLearning-app && set -a && source ./server.env && set +a && NODE_ENV=production PORT=34827 npm run start:server
   ```

   Com **PM2** (carrega `server.env` via `scripts/pm2-start.sh`):

   ```bash
   cd …/chineseLearning-app && pm2 start scripts/pm2-start.sh --name chinese-learning-app && pm2 save
   ```

   Após reboot do SO: `pm2 startup` (uma vez, como o utilizador que corre o PM2) e garantir `pm2 save` com a lista atual.

5. **Nginx** — proxy para o Node (mantém o prefixo `/aulaChines`):

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
