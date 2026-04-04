This is a [Next.js](https://nextjs.org) project for the Chinese Learning site.

**Documentação geral (índice numerado):** [`../docs/01_readme.md`](../docs/01_readme.md).

## `start.sh` (raiz do repositório `chineseLearning/`)

**Desenvolvimento diário (hot reload) — uma URL:**  
**`./start.sh`** (ou **`./start.sh --dev`**, ou **`cd web && npm run hot`**) → **http://127.0.0.1:34827/aulaChines/** · tutor: **…/aulaChines/tutor** (para a LLM: **`web/.env.local`** com **`LLM_API_TOKEN`**).

Outros modos (só quando precisares):

- **`./start.sh --local`** — `build:server` + Node na **34902**, com health/smoke da API antes. **`web/.env.local`** obrigatório.
- **`./start.sh --webplace`** — export estático + Python na **34901**; sem **`/api/chat`**.
- **`./start.sh --prepare`** — valida **`web/deploy/server.env`** + build + smoke; não inicia servidor.
- **`npm run deploy:local:with-api`** — igual **`deploy:local:live`** (build + **34902**).
- **`npm run remote:handshake`** (em `web/`) — SSH: **`/health`** + **`POST /edu/chat`** na VM.
- **`./start.sh --local --ingest`** / **`--skip-build`** — ver **`./start.sh --help`**.

Em host partilhado: **`--no-kill-port`** ou **`START_NO_KILL_PORT=1`**.

## Local dev (site + tutor LLM)

O tutor chama **`POST …/api/chat`** → proxy **`/edu/chat`**. No export estático (`out/`) isso não existe; usa **`./start.sh`** (dev) ou **`npm run start:server`** após build (não uses `next start` em bruto com `basePath` — ver `scripts/start-server-stripped.mjs`).

1. **API LLM** — Docker em **`~/Documents/ITCS/featureLLM`**, porta **28471** no Mac. Em **servidor/VM**, o Next deve chamar a API por **URL alcançável** (típico **`https://llm.webplace.cc`**) — ver **`ITCS/featureLLM/docs/MANUAL_INTEGRACAO.md`** § 1.1; **`web/deploy/server.env`** no deploy. Verificação rápida: `npm run check:llm` (lê `.env` + `.env.local`).

2. **Token** — **`LLM_API_TOKEN`** em **`ITCS/featureLLM/.env`**. No site: **`web/.env.local`** (gitignored), igual ao da API; **`web/.env`** traz o default local de **`LLM_API_URL`** (`http://127.0.0.1:28471`).
3. **Velocidade do tutor** — por defeito o proxy **não** envia `model` em `/edu/chat` (a API usa **`fast`**). Opcional: **`LLM_EDU_CHAT_MODEL=smart`** ou **`LLM_EDU_CHAT_MODEL_RETRY=smart`** (ver **`ITCS/featureLLM/docs/EDU_API_CONTRACT.md`** e **`EDU_CHAT_NUM_PREDICT`** no `.env` da API).

4. **RAG** — `ITCS/featureLLM/docs/CHINESE_LEARNING_PROJECT.md` + `CHINESE_LEARNING_SOURCES` no `featureLLM/.env`.

5. **Hot dev** — preferir na raiz do repo: **`./start.sh`**. Em `web/`: **`npm run dev`** ou **`npm run hot`** (porta **34827**, **`basePath` `/aulaChines`**, reload ao guardar).

   Site: [http://127.0.0.1:34827/aulaChines](http://127.0.0.1:34827/aulaChines) · Tutor: [http://127.0.0.1:34827/aulaChines/tutor](http://127.0.0.1:34827/aulaChines/tutor).

   Sem `basePath`: `npm run dev:plain`.

6. **Produção local (como no servidor)** — mesmo código que em webplace com `basePath` `/aulaChines`:

   ```bash
   npm run build:server
   PORT=34902 npm run start:server
   ```

   Tutor: [http://127.0.0.1:34902/aulaChines/tutor](http://127.0.0.1:34902/aulaChines/tutor) (usa `server.env` / `.env.local` para `LLM_*`). Alternativa: **`../start.sh --local`** na raiz do repo.

7. **RAG (ingest)** — o chat do tutor usa **`/edu/chat`** (eixo educacional), não `/ask`. Para indexar `rag_knowledge/` na biblioteca vetorial da mesma API (perguntas com RAG no futuro):

   ```bash
   npm run ingest:rag
   ```

   Isto corre `connectLLM/ingest-chinese-learning.sh`, que lê `web/.env.local` e faz `POST …/ingest` com `project_id: chinese_learning`. O caminho em `sources` tem de existir **no processo da API** (no Docker, monta o repo ou define `RAG_SOURCES_PATH` — ver [`connectLLM/RAG_PROJETOS_INGEST_ASK.md`](../connectLLM/RAG_PROJETOS_INGEST_ASK.md)).

**Requisitos extra para ingest:** `jq` instalado (`brew install jq`).

## PDFs de vocabulário (`pdf-content/`)

Os ficheiros grandes ficam em **`web/pdf-content/`** (`*.pdf` gitignored). O **`predev`** / **`prebuild`** corre **`sync-pdf-downloads.sh`** (copia para **`public/downloads/`**) e **`build-vocabulary-pdf-manifest.mjs`**, que reescreve **`src/data/vocabulary-pdf-downloads.json`** só com os PDFs que existem na pasta (sem linhas “em breve”).

- **`npm run dev`** / **`npm run build`** — atualiza manifest + cópia para **`public/downloads/`**.
- **`deploy:node`** — o **rsync** envia a pasta **`pdf-content/`** quando existe na tua máquina; **não** envia cópias redundantes em `public/downloads/*.pdf` (no servidor o **prebuild** volta a sincronizar a partir de `pdf-content/`).
- **`deploy:webplace`** — corre o build **localmente**; garante que `pdf-content/` tem os PDFs antes do build para o **`out/`** incluir os ficheiros.
- **URL da lista de PDFs no site:** **`/aulaChines/vocabulary/23`** (o segmento **23** não é bloco do consolidado; está reservado a esta lista).

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
- `npm run deploy:local` — `build:webplace` + cópia para **`$DEPLOY_LOCAL_DIR/aulaChines/`** (default `/tmp/chineseLearning-webplace-out/aulaChines/`).
- `npm run serve:local` — se ainda não existir `…/aulaChines/`, corre `deploy:local`; depois sobe **http://127.0.0.1:34901/aulaChines/** (Python `http.server`). (**Só HTML**; tutor **não** chama a LLM.)
- `npm run deploy:local:live` — `build:server` + `next start` na porta **34902** (ou `PORT=…`); **site + `/aulaChines/api/chat` + tutor** com `.env.local` (`LLM_API_TOKEN`). Para quando quiseres espelhar o deploy “com API” na mesma máquina.
- `deploy/server.env` + `DEPLOY_PUSH_SERVER_ENV=1` — envia `server.env` junto (documentação / ingest noutra máquina).

### B) Node (`next start`) — site + tutor

1. `cp deploy/server.env.example deploy/server.env` e preenche `LLM_*` (e opcionalmente `PORT`, `HOSTNAME=127.0.0.1` — ver comentários no example).
2. Localmente, antes de enviar: **`../../start.sh --prepare`** na raiz do repo (opcional **`--ingest`**) para confirmar env + build sem arrancar nada.
3. `npm run deploy:node` — rsync do código, `scp server.env`, no remoto `npm ci` + `npm run build:server`.
   - **`npm run deploy:node:lite`** — igual, mas **sem** `npm ci` no remoto (só `build:server`). Mais rápido quando só mudaste conteúdo/código e **`package-lock.json`** não mudou. Se o build falhar com *module not found*, volta a correr o deploy normal (há deps novas no lockfile).
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
