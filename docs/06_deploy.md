# Deploy

## Estático (webplace / nginx)

- **Build:** `npm run build:webplace` em `web/` (export para `out/` com `basePath` `/aulaChines`).
- **Scripts:** `npm run deploy:webplace`, `npm run deploy:local` (destino configurável com `DEPLOY_LOCAL_DIR`).
- **Limitação:** não há **`POST /api/chat`** no Next; o tutor com LLM **não** funciona só com estáticos.

Teste local sem Node: **`./start.sh --webplace`** (export + `python3 -m http.server`, porta **34901** por defeito).

Em máquina partilhada (nginx, outros Node, bases de dados), evitar matar portas: **`./start.sh --local --no-kill-port`** ou **`START_NO_KILL_PORT=1`**.

## Preparar release sem arrancar serviços

**`./start.sh --prepare`** — lê **`web/.env`** + **`web/deploy/server.env`** (ficheiro “produção” no disco; template **`web/deploy/server.env.example`**), exige **`LLM_API_TOKEN`**, faz health da API + (opcional) verificação do projeto RAG, corre **`npm run build:server`** em `web/`, depois **teste final** com **`POST /edu/chat`** (saltar com **`START_SKIP_EDU_SMOKE=1`**), e **termina** (não inicia Node, não liberta portas). Opcional: **`--ingest`** para `npm run ingest:rag` após os checks (variáveis já exportadas de `server.env` chegam ao script de ingest).

**Handshake no servidor (mesmos caminhos que o deploy):** em `web/`, **`npm run remote:handshake`** — copia `deploy/server.env` para um ficheiro temporário no host e corre **`/health`** + **`POST /edu/chat`** **a partir da VM**, usando o **`LLM_API_URL`** definido para esse ambiente (normalmente **`https://llm.webplace.cc`**, não loopback — ver **ITCS/featureLLM** `docs/MANUAL_INTEGRACAO.md` § 1.1).

## Node (`next start`) — site + tutor

- **Build:** `npm run build:server`.
- **Arranque:** `PORT=… npm run start:server` com `LLM_*` no ambiente (ex. `deploy/server.env` no servidor). Em **local**, portas e URLs: **`docs/04_operacao_local.md`**.
- **Script:** `npm run deploy:node` (rsync + remoto `npm ci` + `build:server`); detalhes em `web/scripts/deploy-node.sh` e comentários no script.
- **PDFs de vocabulário:** ficheiros em **`web/pdf-content/`** (não versionados); o rsync envia essa pasta quando existe na máquina de deploy; no remoto o **prebuild** corre **`sync-pdf-downloads.sh`** e copia para **`public/downloads/`** (evita duplicar `public/downloads/*.pdf` no rsync).

## Nginx com prefixo

O tráfego deve manter o prefixo **`/aulaChines/`** até ao Next.

**webplace.cc (produção):** o que recebe tráfego na porta 443 costuma ser o contentor **`nginx_global`**, com configs em **`/home/opc/projetos/webplaceMain/nginx/conf.d/`** (ex. **`default.conf`**), não o `/etc/nginx/` do host. Aí **`/aulaChines/`** deve ser **`proxy_pass`** para o Node, **não** `alias` para a pasta estática `chineseLearning/`.

Dentro desse contentor, o host Linux vê-se pelo gateway da bridge Docker (típico **`172.17.0.1`**). Exemplo:

```nginx
location /aulaChines/ {
  proxy_pass http://172.17.0.1:34827;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

Depois: **`docker exec nginx_global nginx -t`** e **`docker exec nginx_global nginx -s reload`**.

O Next no host tem de escutar num endereço acessível a partir do contentor: em **`server.env`** usa **`HOSTNAME=0.0.0.0`** (com **`PORT=34827`**). Só **`127.0.0.1`** faz o proxy da bridge falhar com *connection refused*.

Nginx no **mesmo** sistema que o Node, sem contentor no meio:

```nginx
location /aulaChines/ {
  proxy_pass http://127.0.0.1:34827;
  ...
}
```

A porta do Node deve coincidir com `PORT` / `DEPLOY_NODE_PORT` usados no deploy.

Script de referência (já aplicado uma vez na VM): **`web/deploy/fix-nginx-aulachines-proxy.py`** (substitui blocos `alias` por `proxy_pass` em `default.conf`).

### itcsVM: sem pasta estática montada no nginx

- O volume Docker **`…/chineseLearning` → contentor** foi removido do compose **`/home/opc/decomposers/nginx-global/nginx_decompose.yaml`** (o site em produção não depende dele).
- O export antigo foi arquivado em **`/home/opc/projetos/_archive/chineseLearning-static.<timestamp>`** (recuperável se precisares).
- Ficheiros **`default.conf.bak_*`** que citavam `alias …/chineseLearning` foram movidos para **`_archive/nginx-conf-d-bak-chineseLearning.<timestamp>`**.

### itcsVM: `nginx_global` e porta 443

Se **`docker compose up`** falhar com *address already in use* em **443**, o **Tailscale** na VM pode já estar a escutar HTTPS na stack. Nesse caso o compose foi ajustado para publicar só no IPv4 da interface principal, por exemplo **`10.0.0.73:80:80`** e **`10.0.0.73:443:443`** (ajusta o IP se a NIC mudar). O ficheiro de compose no servidor tem backups `*.bak.*` na mesma pasta.

## Deploy não faz ingest

`deploy:webplace`, `deploy:local` e `deploy:node` **não** executam `POST /ingest`. Após mudanças em `rag_knowledge/`, correr **`npm run ingest:rag`** onde fizer sentido (máquina com acesso à API e caminhos corretos).

Mais pormenores e overrides: **`web/README.md`** (secção Deploy).
