# Operação local

## Comando principal na raiz

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
| Next dev (`npm run dev`) | **34827** | `basePath` pode não ser o mesmo que produção; ver `web/README.md` |
| Next “live” local (`start.sh --local`) | **34902** | Igual a `deploy:local:live`; override com `--port=N` |
| Preview estático webplace | **34901** | `./start.sh --webplace` (Python `http.server`) |
| API LLM | **28471** (no Mac) | Em dev local, `LLM_API_URL` típico `http://127.0.0.1:28471`; em VM usa URL pública ou Tailscale — ver ITCS/featureLLM `docs/MANUAL_INTEGRACAO.md` § 1.1 |

## URLs com `basePath` `/aulaChines`

- Site: `http://127.0.0.1:34902/aulaChines` (com ou sem barra final; o Next pode responder 308 numa variante)
- Tutor: `http://127.0.0.1:34902/aulaChines/tutor`

Preferir **`127.0.0.1`** em vez de `localhost` se o browser resolver `localhost` para IPv6 (`::1`) e o servidor estiver só em IPv4 (`next`/script escuta em `127.0.0.1` por defeito).

## Opções úteis de `start.sh`

- **`--webplace`** — só export estático + HTTP; **sem** `POST /api/chat`.
- **`--ingest`** — após os checks, corre **`npm run ingest:rag`** em `web/` (exige token e, para fila completa, requisitos do script).
- **`--skip-build`** — reutiliza `.next`; útil para iteração rápida, mas o binário pode ficar desalinhado do código.
- **`--help`** — lista todas as flags.

Variáveis: `DEPLOY_LOCAL_DIR`, `STATIC_VIEW_DIR` (modo `--webplace`); ver comentários no próprio `start.sh`.
