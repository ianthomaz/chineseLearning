This is a [Next.js](https://nextjs.org) project for the Chinese Learning site.

**Documentação geral (índice numerado):** [`../docs/01_readme.md`](../docs/01_readme.md).

## Operação em máquina (portas, URLs, deploy local)

**Só** [`../docs/04_operacao_local.md`](../docs/04_operacao_local.md) — não duplicar noutros READMEs.

## Tutor / LLM (específico de `web/`)

O tutor chama **`POST …/api/chat`** → proxy **`/edu/chat`**. No export estático (`out/`) isso não existe; ver **04** para dev vs Node local.

1. **API LLM** — Docker em **`~/Documents/ITCS/featureLLM`**, porta **28471** no Mac. Em **servidor/VM**, o Next chama a API por URL alcançável (típico **`https://llm.webplace.cc`**) — ver **`ITCS/featureLLM/docs/MANUAL_INTEGRACAO.md`** § 1.1; **`web/deploy/server.env`** no deploy. Verificação: `npm run check:llm` (lê `.env` + `.env.local`).

2. **Token** — **`LLM_API_TOKEN`** em **`ITCS/featureLLM/.env`**. No site: **`web/.env.local`** (gitignored), igual ao da API; **`web/.env`** traz o default local de **`LLM_API_URL`** (`http://127.0.0.1:28471`).

3. **Velocidade do tutor** — por defeito o proxy **não** envia `model` em `/edu/chat` (a API usa **`fast`**). Opcional: **`LLM_EDU_CHAT_MODEL=smart`** ou **`LLM_EDU_CHAT_MODEL_RETRY=smart`** (ver **`ITCS/featureLLM/docs/EDU_API_CONTRACT.md`** e **`EDU_CHAT_NUM_PREDICT`** no `.env` da API).

4. **RAG** — `ITCS/featureLLM/docs/CHINESE_LEARNING_PROJECT.md` + `CHINESE_LEARNING_SOURCES` no `featureLLM/.env`.

5. **RAG (ingest)** — o chat usa **`/edu/chat`**, não `/ask`. Para indexar `rag_knowledge/`:

   ```bash
   npm run ingest:rag
   ```

   Corre `connectLLM/ingest-chinese-learning.sh`, que lê `web/.env.local` e faz `POST …/ingest` com `project_id: chinese_learning`. O caminho em `sources` tem de existir **no processo da API** (Docker: montar o repo ou `RAG_SOURCES_PATH` — ver [`connectLLM/RAG_PROJETOS_INGEST_ASK.md`](../connectLLM/RAG_PROJETOS_INGEST_ASK.md)).

**Requisitos extra para ingest:** `jq` instalado (`brew install jq`).

## PDFs de vocabulário (`pdf-content/`)

Os ficheiros grandes ficam em **`web/pdf-content/`** (`*.pdf` gitignored). O **`predev`** / **`prebuild`** corre **`sync-pdf-downloads.sh`** (copia para **`public/downloads/`**) e **`build-vocabulary-pdf-manifest.mjs`**, que reescreve **`src/data/vocabulary-pdf-downloads.json`** só com os PDFs que existem na pasta (sem linhas “em breve”).

- **`npm run dev`** / **`npm run build`** — atualiza manifest + cópia para **`public/downloads/`**.
- **`deploy:node`** — o **rsync** envia a pasta **`pdf-content/`** quando existe na tua máquina; **não** envia cópias redundantes em `public/downloads/*.pdf` (no servidor o **`build:server`** corre **`npm run prebuild:pdf`** primeiro — só sync + manifest, sem `parse-consolidado`, porque **`Content/`** não vai no rsync).
- **`deploy:webplace`** — corre o build **localmente**; garante que `pdf-content/` tem os PDFs antes do build para o **`out/`** incluir os ficheiros.
- **URL da lista de PDFs no site:** **`/aulaChines/vocabulary/23`** (o segmento **23** não é bloco do consolidado; está reservado a esta lista).

## Docs LLM

- [`connectLLM/README.md`](../connectLLM/README.md) — índice
- [`connectLLM/CONTRATO_EDU_COMPLETO.md`](../connectLLM/CONTRATO_EDU_COMPLETO.md) — `/edu/chat`, formato `reply_structured`

## Deploy

### A) Estático (`out/` → nginx `alias`)

Só páginas; **tutor não funciona**.

- `npm run deploy:webplace` — rsync para `itcsVM1:/home/opc/projetos/chineseLearning` (ver script).
- `npm run deploy:local` — `build:webplace` + cópia para **`$DEPLOY_LOCAL_DIR/aulaChines/`** (default `/tmp/chineseLearning-webplace-out/aulaChines/`).
- `npm run serve:local` — estático local; URL em **04**.
- `npm run deploy:local:live` — Node local com API; ver **04**.
- `deploy/server.env` + `DEPLOY_PUSH_SERVER_ENV=1` — envia `server.env` junto (documentação / ingest noutra máquina).

### B) Node (`next start`) — site + tutor — **itcsVM1 (legado)**

Build no remoto — **não usar em itcsVM3** (VM pequena).

1. `cp deploy/server.env.example deploy/server.env` e preenche `LLM_*`.
2. **`../../start.sh --prepare`** na raiz (opcional **`--ingest`**).
3. `npm run deploy:node` — rsync, `scp server.env`, remoto `npm ci` + `build:server`.
4. PM2 / nginx — ver abaixo.

### C) Node — **itcsVM3** (produção nova, VM E2.Micro)

Build **sempre no Mac**; remoto só recebe artefactos.

| Passo | Comando | O que faz |
|-------|---------|-----------|
| 1 | `node scripts/sync-env-from-credentials.mjs` | `credentials.json` → `deploy/server.env` |
| 2 | `./start.sh --prod` | valida env + LLM + `build:server` local |
| 3 | `./start.sh --prod --upload` | rsync + `server.env` + `npm ci --omit=dev` no remoto |
| 4 | `npm run remote:handshake` | health LLM **desde a VM** |

Alternativa passo 3: `npm run deploy:prod` (requer passos 1–2 feitos). PM2 reload: `DEPLOY_PROD_RESTART=1 npm run deploy:prod`.

**Env:** `local/credentials/credentials.json` → `deployment.prod_ssh_host` (`itcsVM3`), `prod_remote_dir`, `server_hostname` (`127.0.0.1`).

**Nginx (host partilhado, sem monopolizar :80):** template `deploy/nginx-itcsVM3-aulachines.conf.example` — vhost `aulaChines.webplace.cc` → `127.0.0.1:34827`.

**itcsVM1 legado:** secção B + `deploy:node`. Detalhes: [`../docs/06_deploy.md`](../docs/06_deploy.md).

### PM2 + nginx (comum)

1. No servidor:

   ```bash
   cd …/chineseLearning-app && pm2 start scripts/pm2-start.sh --name chinese-learning-app && pm2 save
   ```

2. **Nginx** — proxy (prefixo `/aulaChines`):

   ```nginx
   location /aulaChines/ {
     proxy_pass http://127.0.0.1:34827;
     proxy_http_version 1.1;
     proxy_set_header Host $host;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
   ```

   Ajusta `34827` a `PORT` em `server.env`.

Overrides: `scripts/deploy-prod.sh`, `scripts/deploy-node.sh` (legado).

---

Legacy `create-next-app` boilerplate below (Vercel, etc.) pode ser ignorado para este projeto.
