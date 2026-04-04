#!/usr/bin/env bash
set -euo pipefail
#
# Orquestra verificação de ambiente + ingest opcional + deploy local OU preparação para produção.
#
# Uso:
#   ./start.sh                      # default: hot dev (Next + Turbopack, porta 34827) — UMA URL para o dia-a-dia
#   ./start.sh --dev                # igual ao default
#   ./start.sh --local              # next start + /api/chat + tutor (porta 34902; checks LLM antes)
#   ./start.sh --webplace           # export estático + HTTP (34901); NÃO fala com LLM (só HTML)
#   ./start.sh --prepare            # valida web/deploy/server.env + health LLM + build:server (NÃO inicia servidor)
#   ./start.sh --local --ingest     # idem + fila de ingest RAG antes de subir o site
#   ./start.sh --local --port=34903
#   ./start.sh --local --skip-build # reutiliza .next (rápido; cuidado com código desatualizado)
#   ./start.sh --local --no-kill-port  # falha se a porta estiver ocupada (não mata processo)
#
# Servidor partilhado / produção no mesmo host:
#   export START_NO_KILL_PORT=1     # mesmo efeito que --no-kill-port em --local / --webplace
#   (nunca matar portas em máquinas com nginx, DB, outros Node, etc.)
#
# Saltar smoke lento do tutor (POST /edu/chat, até ~120s):
#   export START_SKIP_EDU_SMOKE=1
#
# Variáveis: DEPLOY_LOCAL_DIR (export estático fica em \$DEPLOY_LOCAL_DIR/aulaChines/; ver modo --webplace)
#
# LLM_API_URL: fallback http://127.0.0.1:28471 só faz sentido com API Docker no mesmo Mac.
# Produção / VM: definir em web/deploy/server.env — ver ITCS/featureLLM/docs/MANUAL_INTEGRACAO.md § 1.1
# (https://llm.webplace.cc ou IP Tailscale do mini62; itcsVM + 127.0.0.1 só com túnel SSH).

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$REPO_ROOT/web"

MODE=""
DO_INGEST=0
KILL_PORT=1
LIVE_PORT=34902
STATIC_PORT=34901
DEV_PORT=34827
SKIP_BUILD=0
DEPLOY_LOCAL_DIR="${DEPLOY_LOCAL_DIR:-/tmp/chineseLearning-webplace-out}"

usage() {
  echo "Uso: $0 [ --dev | --local | --webplace | --prepare ] [opções]"
  echo ""
  echo "  (default / --dev)  Hot reload: Next + Turbopack. URL: http://127.0.0.1:${DEV_PORT}/aulaChines/"
  echo "                     Tutor usa /tutor (precisa web/.env.local com LLM_API_TOKEN)."
  echo "  --local          Site com API como em produção + checks LLM antes. Porta $LIVE_PORT."
  echo "  --webplace       Só HTML estático (como nginx webplace). Porta $STATIC_PORT."
  echo "  --prepare        Produção: valida deploy/server.env, health LLM, npm run build:server."
  echo "                   Não inicia Node nem mata portas (deixa pronto para systemd/pm2 no servidor)."
  echo "  --ingest         Só com --local ou --prepare: corre npm run ingest:rag (precisa token + jq)."
  echo "  --no-kill-port   Não mata processo na porta; erro se ocupada (recomendado em host partilhado)."
  echo "  --port=N         Porta para --local (default $LIVE_PORT)."
  echo "  --static-port=N  Porta para --webplace (default $STATIC_PORT)."
  echo "  --skip-build     Com --local: não corre build:server (usa .next existente)."
  echo "  -h, --help       Esta ajuda."
  echo ""
  echo "  START_NO_KILL_PORT=1   — define por ambiente o mesmo que --no-kill-port."
  echo "  START_SKIP_EDU_SMOKE=1 — não corre POST /edu/chat ao final (só health + /projects)."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev) MODE=dev; shift ;;
    --local) MODE=local; shift ;;
    --webplace) MODE=webplace; shift ;;
    --prepare) MODE=prepare; shift ;;
    --ingest) DO_INGEST=1; shift ;;
    --no-kill-port) KILL_PORT=0; shift ;;
    --port=*) LIVE_PORT="${1#*=}"; shift ;;
    --static-port=*) STATIC_PORT="${1#*=}"; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Opção desconhecida: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "${START_NO_KILL_PORT:-}" == "1" ]]; then
  KILL_PORT=0
fi

if [[ -z "$MODE" ]]; then
  MODE=dev
fi

load_env() {
  set -a
  # shellcheck source=/dev/null
  [[ -f "$WEB_DIR/.env" ]] && source "$WEB_DIR/.env"
  # shellcheck source=/dev/null
  [[ -f "$WEB_DIR/.env.local" ]] && source "$WEB_DIR/.env.local"
  set +a
}

# Produção: mesmo ficheiro que deploy:node envia (web/deploy/server.env). Também chamado "env.prod" no servidor.
load_prod_env() {
  set -a
  # shellcheck source=/dev/null
  [[ -f "$WEB_DIR/.env" ]] && source "$WEB_DIR/.env"
  if [[ ! -f "$WEB_DIR/deploy/server.env" ]]; then
    echo "Falta web/deploy/server.env — copia web/deploy/server.env.example e preenche LLM_* (e PORT se precisares)." >&2
    exit 1
  fi
  # shellcheck source=/dev/null
  source "$WEB_DIR/deploy/server.env"
  set +a
}

free_port() {
  local p="$1"
  local pids
  if ! command -v lsof >/dev/null 2>&1; then
    echo "lsof não encontrado; não consigo libertar a porta $p." >&2
    return 1
  fi
  pids="$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  echo "  A libertar porta $p (PIDs: $pids)…"
  kill $pids 2>/dev/null || true
  sleep 1
  pids="$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "  A forçar SIGKILL…"
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
}

check_llm_health() {
  local url="${LLM_API_URL:-http://127.0.0.1:28471}"
  url="${url%/}"
  echo "→ Health LLM: $url/health"
  if [[ -n "${LLM_API_TOKEN:-}" ]]; then
    if curl -sf -m 20 -H "Authorization: Bearer $LLM_API_TOKEN" "$url/health" >/dev/null; then
      echo "  OK."
    else
      echo "  ERRO: API não respondeu (token/URL ou serviço parado)." >&2
      return 1
    fi
  else
    if curl -sf -m 20 "$url/health" >/dev/null; then
      echo "  OK (sem Bearer)."
    else
      echo "  Aviso: health falhou e não há LLM_API_TOKEN." >&2
      if [[ "$MODE" == "local" || "$MODE" == "prepare" ]]; then
        return 1
      fi
    fi
  fi
  echo ""
}

check_chinese_learning_project() {
  [[ -n "${LLM_API_TOKEN:-}" ]] || return 0
  command -v jq >/dev/null 2>&1 || {
    echo "  (Sem jq — a saltar verificação GET /projects.)"
    echo ""
    return 0
  }
  local url="${LLM_API_URL:-http://127.0.0.1:28471}"
  url="${url%/}"
  echo "→ Projeto RAG chinese_learning (GET /projects)…"
  if curl -sf -m 20 -H "Authorization: Bearer $LLM_API_TOKEN" "$url/projects" | jq -e '.projects[] | select(.project_id=="chinese_learning")' >/dev/null 2>&1; then
    echo "  OK — registado na API."
  else
    echo "  Aviso: não encontrado. Corre ./start.sh --ingest (com outro modo) ou npm run ingest:rag em web/." >&2
  fi
  echo ""
}

run_ingest() {
  echo "→ ingest:rag…"
  (cd "$WEB_DIR" && npm run ingest:rag)
  echo ""
}

# Smoke: uma chamada real ao eixo educacional (mesmo caminho que o tutor no site).
run_llm_edu_chat_smoke() {
  if [[ "${START_SKIP_EDU_SMOKE:-}" == "1" ]]; then
    echo "→ Smoke POST /edu/chat — omitido (START_SKIP_EDU_SMOKE=1)."
    echo ""
    return 0
  fi
  [[ -n "${LLM_API_TOKEN:-}" ]] || return 0
  local url="${LLM_API_URL:-http://127.0.0.1:28471}"
  url="${url%/}"
  echo "→ Smoke POST /edu/chat (timeout 120s)…"
  local resp
  if ! resp="$(curl -sS -m 120 -X POST "$url/edu/chat" \
    -H "Authorization: Bearer $LLM_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Handshake: responde com uma saudação mínima em chinês.","level":"HSK1","language":"zh-CN"}' 2>&1)"; then
    echo "  ERRO: falha de rede ou timeout em POST /edu/chat." >&2
    echo "$resp" >&2
    return 1
  fi
  if command -v jq >/dev/null 2>&1; then
    if ! echo "$resp" | jq -e '(.full_reply_text // .reply | type) == "string" and ((.full_reply_text // .reply | length) > 0)' >/dev/null 2>&1; then
      echo "  ERRO: resposta sem full_reply_text/reply útil." >&2
      echo "$resp" | head -c 1200 >&2
      return 1
    fi
  else
    if ! echo "$resp" | grep -qE '"full_reply_text"\s*:\s*"[^"]+"' && ! echo "$resp" | grep -qE '"reply"\s*:\s*"[^"]+"'; then
      echo "  ERRO: JSON inesperado (instala jq para validação melhor)." >&2
      echo "$resp" | head -c 1200 >&2
      return 1
    fi
  fi
  echo "  OK."
  echo ""
}

# --- modo dev (default): Next + Turbopack, hot reload — uma URL para desenvolvimento diário
if [[ "$MODE" == "dev" ]]; then
  if [[ "$DO_INGEST" == "1" ]]; then
    echo "Aviso: --ingest não aplica ao modo dev; usa: $0 --local --ingest" >&2
  fi
  if [[ "$KILL_PORT" == "1" ]]; then
    free_port "$DEV_PORT" || true
  fi
  if lsof -i ":$DEV_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Porta $DEV_PORT ocupada. Encerra o processo ou altera a porta em web/package.json (script dev)." >&2
    exit 1
  fi
  echo "→ Hot dev (Turbopack) · http://127.0.0.1:${DEV_PORT}/aulaChines/"
  echo "  Tutor: http://127.0.0.1:${DEV_PORT}/aulaChines/tutor  (precisa web/.env.local)"
  echo "  Igual: cd web && npm run dev"
  echo "  Para build + Node como produção (checks LLM): $0 --local"
  echo "  Ctrl+C para parar."
  echo ""
  cd "$WEB_DIR"
  exec npm run dev
fi

# --- modo --prepare (produção local: validar + build; não arrancar nada)
if [[ "$MODE" == "prepare" ]]; then
  load_prod_env
  export LLM_API_URL="${LLM_API_URL:-http://127.0.0.1:28471}"
  export LLM_API_URL="${LLM_API_URL%/}"

  if [[ -z "${LLM_API_TOKEN:-}" ]]; then
    echo "LLM_API_TOKEN vazio em web/deploy/server.env." >&2
    exit 1
  fi

  check_llm_health || exit 1
  check_chinese_learning_project

  if [[ "$DO_INGEST" == "1" ]]; then
    run_ingest
  fi

  echo "→ build:server (NEXT_PUBLIC_BASE_PATH=/aulaChines)…"
  (cd "$WEB_DIR" && npm run build:server)

  echo "→ Testes finais (LLM)…"
  run_llm_edu_chat_smoke || exit 1

  echo ""
  echo "  [ prepare ] Concluído. Nenhum servidor foi iniciado; nenhuma porta foi libertada."
  echo "  Ambiente:   web/deploy/server.env (template: web/deploy/server.env.example)"
  echo "  No servidor (após rsync / deploy:node), exemplo:"
  echo "    cd <REMOTE_DIR> && set -a && source ./server.env && set +a && PORT=\${PORT:-34827} npm run start:server"
  echo "  Nginx:      proxy_pass deve apontar para 127.0.0.1:\$PORT (ver docs/06_deploy.md)."
  echo ""
  exit 0
fi

# --- modo --webplace: só HTML estático (python http.server). Não há Route Handlers — tutor/LLM não funcionam aqui.
# Não carregamos nem testamos LLM (evita “Docker vs https://llm.webplace.cc” a bloquear o preview).
if [[ "$MODE" == "webplace" ]]; then
  if [[ "$DO_INGEST" == "1" ]]; then
    echo "--ingest não combina com --webplace (export sem API). Usa: ./start.sh --local --ingest  ou  ./start.sh --prepare --ingest" >&2
    exit 1
  fi
  if [[ "$KILL_PORT" == "1" ]]; then
    free_port "$STATIC_PORT" || true
  fi
  if lsof -i ":$STATIC_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Porta $STATIC_PORT ainda ocupada." >&2
    exit 1
  fi
  echo "→ Build estático (webplace)…"
  (cd "$WEB_DIR" && export DEPLOY_LOCAL_DIR && npm run deploy:local)
  echo ""
  echo "  Estático: http://127.0.0.1:${STATIC_PORT}/aulaChines/"
  echo "  (ficheiros em: $DEPLOY_LOCAL_DIR/aulaChines/)"
  echo "  Tutor com LLM: ./start.sh --local  ou  cd web && npm run deploy:local:live"
  echo "  LLM_API_URL em web/.env.local: http://127.0.0.1:28471 (Docker) ou https://llm.webplace.cc (mesmo token)."
  echo "  Ctrl+C para parar."
  echo ""
  cd "$DEPLOY_LOCAL_DIR"
  exec python3 -m http.server "$STATIC_PORT" -b 127.0.0.1
fi

# --- modo --local: Next com /api/chat; LLM_API_URL pode ser local ou HTTPS (MANUAL_INTEGRACAO § 1.1)
load_env
export LLM_API_URL="${LLM_API_URL:-http://127.0.0.1:28471}"
export LLM_API_URL="${LLM_API_URL%/}"

if [[ ! -f "$WEB_DIR/.env.local" ]]; then
  echo "Falta web/.env.local (mínimo: LLM_API_TOKEN)." >&2
  exit 1
fi
if [[ -z "${LLM_API_TOKEN:-}" ]]; then
  echo "LLM_API_TOKEN vazio em web/.env.local." >&2
  exit 1
fi

check_llm_health || exit 1
check_chinese_learning_project

if [[ "$DO_INGEST" == "1" ]]; then
  run_ingest
fi

echo "→ Testes finais (LLM)…"
run_llm_edu_chat_smoke || exit 1

if [[ "$KILL_PORT" == "1" ]]; then
  free_port "$LIVE_PORT" || true
fi
if lsof -i ":$LIVE_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Porta $LIVE_PORT ainda ocupada. Encerra o processo ou usa --port=outra ou --no-kill-port (ou START_NO_KILL_PORT=1 e resolve manualmente)." >&2
  exit 1
fi
export SKIP_PORT_CHECK=1
export PORT="$LIVE_PORT"
export SKIP_BUILD
exec bash "$WEB_DIR/scripts/deploy-local-live.sh"
