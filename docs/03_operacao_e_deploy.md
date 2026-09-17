# Operação local e deploy

**Fonte única** para portas, URLs locais, `start.sh` e produção em learnchinese.today.

Auth OAuth: [05_autenticacao.md](05_autenticacao.md) · LLM: [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md)

---

## Portas (fixas)

| O quê | Porta | Comando |
|-------|------:|---------|
| Dev Next (Turbopack) | **34827** | `./start.sh` ou `cd web && npm run dev` |
| Node local “como prod” | **34902** | `./start.sh --local` |
| HTML estático (`out/`) | **34901** | `./start.sh --webplace` |

**34827** = só `next dev`. **34902** = só `next start`. **34901** = só estático.

A porta da **API LLM** (`LLM_API_URL`, tipicamente 28471) é independente — ver [04](04_llm_conteudo_rag.md).

OAuth GCP usa **34827** (dev) e **34902** (`--local`). **34901** não tem OAuth.

---

## Dev diário (sem LLM)

```bash
./start.sh
```

**http://127.0.0.1:34827/** — hot reload. Revisão, vocabulário, jogo, etc. funcionam sem API. Tutor precisa de LLM configurada.

Preferir `127.0.0.1` a `localhost` (IPv6).

**Nada na 34827?** Só há site enquanto `./start.sh` corre nesse terminal. Se usas só `--local` (34902), a 34827 fica vazia — normal.

**Dois servidores ao mesmo tempo?** Opcional. Escolhe uma URL: 34827 (hot) ou 34902 (prod local).

---

## Node local com API

```bash
./start.sh --local
```

**http://127.0.0.1:34902/** — build prod + Route Handlers. Por defeito exige `LLM_API_TOKEN` e health.

Sem LLM: `START_SKIP_LLM_CHECKS=1 ./start.sh --local`

Ingest RAG: `./start.sh --local --ingest`

**34902 ocupada?** Outra instância deste site — encerra o processo ou `SKIP_PORT_CHECK=1` (excepção).

Antes de commit/build: `cd web && npx next build && npm run build:webplace && npx eslint src && npx tsc --noEmit` — ver [08_produto_observabilidade.md](08_produto_observabilidade.md) § Performance.

---

## Outros modos locais

| Objetivo | Comando |
|----------|---------|
| Só HTML (sem tutor/API) | `./start.sh --webplace` → **34901** |
| Validar env + build, sem servidor | `./start.sh --prepare` |
| Preview export | `cd web && npm run preview:webplace` |

`./start.sh --help` — todas as flags.

`DEPLOY_LOCAL_DIR` (default `/tmp/chineseLearning-webplace-out`) — raiz do export estático.

---

## Produção — learnchinese.today

| Item | Valor |
|------|-------|
| Site | `https://learnchinese.today/` (sem `basePath`) |
| VM | **itcsVM3** — nginx no host, Node `127.0.0.1:34827` |
| DNS | Cloudflare proxied |

### ENV

```bash
node scripts/sync-env-from-credentials.mjs   # → web/.env.local + web/deploy/server.env
```

Produção: `NEXTAUTH_URL=https://learnchinese.today`, `NEXT_PUBLIC_BASE_PATH=` (vazio), `HOSTNAME=127.0.0.1`, `PORT=34827`, `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2YMPSSQJND`.

### Preparar servidor (antes do 1.º deploy)

Infra no itcsVM3 **sem** enviar código nem reiniciar PM2:

```bash
node scripts/sync-env-from-credentials.mjs
cd web && npm run prepare:prod-server
```

Instala nginx (`learnchinese.today` → `127.0.0.1:34827`), faz staging de `server.env.next`, testa LLM remoto, activa PM2 no boot.

**Sem legado:** no servidor só existe vhost `learnchinese.today` — removido `aulaChines.webplace.cc` / nginx antigo. PM2 parado até ao deploy (porta **34827** livre).

**DNS:**

| Domínio | Acção |
|---------|--------|
| `learnchinese.today` + `www` | **Principal** — A/CNAME → **163.176.253.230** (Cloudflare proxied) |
| `learnchinese.page` + `www` | **Redirect 301** → `learnchinese.today` (CF ruleset + nginx fallback) |
| `aulaChines.webplace.cc` | **Removido** (set 2026) |
| `learchinese.com` | Typo — ignorar / apagar zona quando quiseres |

**No deploy:** `./start.sh --prod --upload` com `DEPLOY_PROD_RESTART=1` copia `server.env` e faz `pm2 reload`.

### Pipeline (build só no Mac)

| # | Comando |
|---|---------|
| 0 | `npm run prepare:prod-server` (uma vez; infra) |
| 1 | `node scripts/sync-env-from-credentials.mjs` |
| 2 | `./start.sh --prod` |
| 3 | `./start.sh --prod --upload` (ou `cd web && npm run deploy:prod`) |
| 4 | `DEPLOY_PROD_RESTART=1` no upload **ou** `pm2 reload` manual |
| 5 | `cd web && npm run remote:handshake` |

Overrides: `DEPLOY_PROD_HOST`, `DEPLOY_PROD_DIR`, `DEPLOY_PROD_RESTART=1`, `DEPLOY_PROD_SKIP_NPM_CI=1`.

**Sobe:** `.next/`, `data/app-library/`, `public/ktv/`. **Não sobe:** `*.sqlite` (preservado no servidor).

### Cloudflare DNS (resumo)

| Type | Name | Notas |
|------|------|-------|
| A/CNAME | `@` | IP itcsVM3, proxied |
| CNAME | `www` | → apex |
| MX/TXT | `@`, `_dmarc`, `google._domainkey` | Email Workspace |

### SSL

Cloudflare **Full (strict)** + Origin Certificate → `/etc/nginx/ssl/learnchinese.{crt,key}`

Template: `web/deploy/nginx-learnchinese.conf.example` → `/etc/nginx/conf.d/learnchinese.today.conf`

### Nginx → Node

```nginx
location / {
  proxy_pass http://127.0.0.1:34827;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Estático vs Node

| Modo | Build | Tutor/API |
|------|-------|-----------|
| Estático | `npm run build:webplace` | Não |
| Node | `npm run build:server` + `npm run start:server` | Sim |

Deploy **não** corre ingest RAG — `npm run ingest:rag` à parte.

Mais detalhe nginx: [`web/deploy/README.md`](../web/deploy/README.md).
