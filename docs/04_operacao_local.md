# Operação local

**Este ficheiro é a única fonte** para portas, URLs em local, `start.sh` e “deploy local”. Não duplicar estes parágrafos noutros READMEs — cá um link basta.

## Contrato de portas (fixo neste repo)

Estes números **não se alteram** ao refatorar docs nem ao “simplificar” — só com decisão explícita no projeto.

| O quê | Porta | Comando típico |
|-------|------:|----------------|
| Hot dev Next (Turbopack) | **34827** | `./start.sh` ou `cd web && npm run dev` |
| Node local “como prod” + `/api` | **34902** | `./start.sh --local` ou `npm run deploy:local:live` |
| HTML estático (`out/` + `http.server`) | **34901** | `./start.sh --webplace` ou `npm run serve:local` / `npm run preview:webplace` |

**34827** é **só** para `next dev`. **34902** é **só** para `next start` / deploy local Node. **34901** é **só** para estático. Não trocar estes papéis entre si.

**O que isto não é:** “monitorizar” ou **fixar no doc** a porta em que a **API LLM** escuta — isso pertence ao env da API (`LLM_API_URL`, `connectLLM/`, etc.), **não** à tabela **34827 / 34902 / 34901** acima.

**O que isto continua a ser:** o `./start.sh --local` **por defeito** chama a API para **ver se está operacional** (health, smoke) e, com **`--ingest`**, corre o **ingest** de dados novos para o RAG — é **consultar / usar** a LLM, não “alterar porta da LLM” neste projeto. O mesmo espírito em `--prepare --ingest`.

`--port=` / `PREVIEW_WEBPLACE_PORT` / `PORT=` só em **exceção** (máquina partilhada, conflito real).

---

## Ver o site a correr (recomendado — **não** precisa de API LLM)

Na **raiz** do repositório:

```bash
./start.sh
```

(Equivale a `cd web && npm run dev` — Turbopack, porta fixa **34827**.) Revisão, vocabulário, random hanzi, etc. funcionam **sem** configurar LLM. Só o **tutor** e chamadas que batem na API precisam de credenciais noutro sítio (`connectLLM/` / `.env.local` quando fores lá).

**URL única para acompanhar modificações ao código:**  
**http://127.0.0.1:34827/aulaChines/** (ou **`http://127.0.0.1:34827/aulaChines`** sem barra final — ambos servem.)

**Não uses só** `http://127.0.0.1:34827/` **(porta sem caminho)** — o `next.config` redireciona `/` → **`/aulaChines/`** (e `/randomhanzi` → **`/aulaChines/randomhanzi`**). Outras rotas em URL “curto” sem prefixo podem dar 404; usa sempre **`/aulaChines/…`** ou o URL completo.

Guardas o ficheiro → recarregas o browser → vês a alteração. `Ctrl+C` no terminal para parar.

Rotas relativas ao site (sem repetir o prefixo no browser): **`/randomhanzi`**, **`/randomhanzi?autostart=1`**, tutor **`/tutor`**. O Next já serve sob **`/aulaChines`**; se estiveres em `…/aulaChines/` e colares **`aulaChines/randomhanzi`**, o URL fica errado (`…/aulaChines/aulaChines/…`) — usa só o segmento extra ou o URL completo abaixo.

URLs completos de exemplo (copiar à vontade): `http://127.0.0.1:34827/aulaChines/randomhanzi?autostart=1` · `http://127.0.0.1:34827/aulaChines/tutor`

Preferir **`127.0.0.1`** em vez de `localhost` se o browser resolver `localhost` para IPv6 (`::1`) e o servidor estiver só em IPv4.

### Não vês nada na 34827?

Só há site nessa porta **enquanto** o `./start.sh` (sem flags) estiver a correr nesse terminal. Se estiveres a usar **só** `./start.sh --local` (34902), a 34827 fica sem servidor — é normal.

### Dois servidores ao mesmo tempo?

**Não é obrigatório.** Para simplificar: **ou** corres `./start.sh` (34827, hot reload) **ou** `./start.sh --local` (34902, build prod), conforme o que precisas naquele momento. Se os dois estiverem ligados, são **duas URLs diferentes** — escolhe uma para não te cruzares.

---

## Deploy local Node (opcional — **sem** hot reload)

Quando quiseres o **mesmo tipo de build** que em produção (Route Handlers, etc.), na raiz:

```bash
./start.sh --local
```

**URL:** **http://127.0.0.1:34902/aulaChines/**

Por defeito o script **exige** `web/.env.local`, **health** e **smoke** na API (URL em `LLM_API_URL`) — fluxo normal de **integração** com a LLM, independentemente da tabela de portas **só do Next** acima.

**Só queres o site Node local sem falar com a API LLM** (páginas + build; tutor pode falhar até teres API):

```bash
START_SKIP_LLM_CHECKS=1 ./start.sh --local
```

Em `web/`: o mesmo com **`SKIP_LLM_CHECKS=1 npm run deploy:local:live`**.

Cada alteração de código implica **voltar a correr** este fluxo (ou `--skip-build` se souberes o que estás a fazer).

Se **34902** estiver ocupada, muitas vezes é **outra instância deste site** — encerra esse processo.

Turbopack no dev usa o mesmo **`basePath`** `/aulaChines` que produção.

## Fluxo `./start.sh --local` (passos)

**Com checks LLM (default):** carrega `web/.env` e `web/.env.local`, exige `LLM_API_TOKEN`, health, smoke opcional, **`--ingest`** corre ingest RAG quando pedido, liberta **34902**, `deploy-local-live.sh` → **`npm run build:server`** e **`PORT=34902 npm run start:server`**.

**Com `START_SKIP_LLM_CHECKS=1`:** saltam pontos 2–4 e o smoke; `deploy-local-live` não exige token.

## Outros modos

| Objetivo | Comando |
|----------|---------|
| Só HTML (sem `POST /api/chat`) | `./start.sh --webplace` |
| Release: validar env + build + smoke, **sem** subir servidor | `./start.sh --prepare` |
| Ingest RAG após checks | `./start.sh --local --ingest` ou `./start.sh --prepare --ingest` |

**`./start.sh --help`** — todas as flags. Host partilhado: **`--no-kill-port`** ou **`START_NO_KILL_PORT=1`**.

## Variável de export estático

**`DEPLOY_LOCAL_DIR`** (default `/tmp/chineseLearning-webplace-out`): o export fica em **`$DEPLOY_LOCAL_DIR/aulaChines/`**; o `http.server` usa **`$DEPLOY_LOCAL_DIR`** como document root. Ver `start.sh` e `web/scripts/deploy-webplace.sh`.

## `npm run preview:webplace` (em `web/`)

Corre `web/scripts/preview-webplace-local.sh`: export estático + `python3 -m http.server`. Porta default **34901** (igual ao `--webplace`; override **`PREVIEW_WEBPLACE_PORT`**). **Não** usa a 34827 — essa fica reservada ao `next dev`.
