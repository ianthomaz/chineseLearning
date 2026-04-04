# Operação local

## URL principal (hot reload)

| Objetivo | Comando | Porta | URL base |
|----------|---------|-------|----------|
| **Dia a dia (recomendado)** | **`./start.sh`** ou **`./start.sh --dev`** | **34827** | **http://127.0.0.1:34827/aulaChines/** |

Igual a `cd web && npm run dev` (ou `npm run hot`). Tutor: **`…/aulaChines/tutor`** — para a LLM responder, **`web/.env.local`** com **`LLM_API_TOKEN`** (e opcionalmente **`LLM_API_URL`**).

## Outros modos

| Objetivo | Comando | Porta típica | LLM no tutor |
|----------|---------|----------------|--------------|
| Só HTML (como webplace) | `./start.sh --webplace` | 34901 | Não |
| Node como produção + checks LLM antes | `./start.sh --local` ou `npm run deploy:local:with-api` | 34902 | Sim |

## Comando com checks completos (não é o default)

```bash
./start.sh --local
```

Fluxo resumido:

1. Carrega `web/.env` e `web/.env.local`.
2. Exige `LLM_API_TOKEN` no modo `--local`.
3. Verifica **`GET {LLM_API_URL}/health`** (com Bearer se definido).
4. Opcionalmente verifica se o projeto **`chinese_learning`** aparece em **`GET /projects`** (precisa de `jq` e token).
5. Liberta a porta por defeito **34902** (a menos que uses `--no-kill-port`).
6. Corre `web/scripts/deploy-local-live.sh`: **`npm run build:server`** (salvo `--skip-build`) e **`npm run start:server`** (servidor Node em `scripts/start-server-stripped.mjs`, necessário com `basePath` `/aulaChines`).

## Portas usuais

| Serviço | Porta (defeito) | Notas |
|---------|-----------------|-------|
| **Hot dev** (`./start.sh`, `npm run dev`) | **34827** | Mesmo **`basePath` `/aulaChines`** que produção |
| Next “live” local (`start.sh --local`) | **34902** | Igual a `deploy:local:live`; override com `--port=N` |
| Preview estático webplace | **34901** | `./start.sh --webplace` (Python `http.server`) |
| API LLM | **28471** (no Mac) | Em dev local, `LLM_API_URL` típico `http://127.0.0.1:28471`; em VM usa URL pública ou Tailscale — ver ITCS/featureLLM `docs/MANUAL_INTEGRACAO.md` § 1.1 |

## URLs com `basePath` `/aulaChines`

- **Hot dev:** `http://127.0.0.1:34827/aulaChines` · tutor: `…/aulaChines/tutor`
- **Modo `--local`:** `http://127.0.0.1:34902/aulaChines` · tutor: `…/aulaChines/tutor`

Preferir **`127.0.0.1`** em vez de `localhost` se o browser resolver `localhost` para IPv6 (`::1`) e o servidor estiver só em IPv4 (`next`/script escuta em `127.0.0.1` por defeito).

## Opções úteis de `start.sh`

- **`--webplace`** — só export estático + HTTP; **sem** `POST /api/chat`.
- **`--ingest`** — após os checks, corre **`npm run ingest:rag`** em `web/` (exige token e, para fila completa, requisitos do script).
- **`--skip-build`** — reutiliza `.next`; útil para iteração rápida, mas o binário pode ficar desalinhado do código.
- **`--help`** — lista todas as flags.

Variáveis: `DEPLOY_LOCAL_DIR` (default `/tmp/chineseLearning-webplace-out`). O export estático fica em **`$DEPLOY_LOCAL_DIR/aulaChines/`** para coincidir com o `basePath` `/aulaChines` nos URLs; o servidor HTTP usa **`$DEPLOY_LOCAL_DIR`** como document root. Ver `start.sh` e `web/scripts/deploy-webplace.sh`.
