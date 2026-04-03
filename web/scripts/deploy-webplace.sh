#!/usr/bin/env bash
set -euo pipefail
# Static export (basePath /aulaChines) → SSH ou diretório local. Tutor/API não incluídos — usar deploy-node.sh + next start.
# Produção em webplace.cc: /aulaChines/ → proxy para Node (PM2), não alias estático. Este rsync é legado / backup offline.
#
# Overrides:
#   DEPLOY_WEBPLACE_HOST, DEPLOY_WEBPLACE_DIR  — SSH rsync target (default: itcsVM + /home/opc/projetos/chineseLearning)
#   DEPLOY_LOCAL_DIR                           — if set, rsync ./out/ → $DEPLOY_LOCAL_DIR/aulaChines/ (no SSH); raiz para http.server = DEPLOY_LOCAL_DIR
#   DEPLOY_LOAD_SERVER_ENV=1                 — source deploy/server.env before build (optional)
#   DEPLOY_PUSH_SERVER_ENV=1                 — after rsync, scp deploy/server.env → REMOTE_DIR/server.env

REMOTE="${DEPLOY_WEBPLACE_HOST:-itcsVM}"
REMOTE_DIR="${DEPLOY_WEBPLACE_DIR:-/home/opc/projetos/chineseLearning}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_ENV_FILE="$WEB_DIR/deploy/server.env"

cd "$WEB_DIR"

if [[ "${DEPLOY_LOAD_SERVER_ENV:-0}" == "1" ]]; then
  if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
    echo "DEPLOY_LOAD_SERVER_ENV=1 but missing: $DEPLOY_ENV_FILE" >&2
    echo "  Copy deploy/server.env.example → deploy/server.env" >&2
    exit 1
  fi
  set -a
  # shellcheck source=/dev/null
  source "$DEPLOY_ENV_FILE"
  set +a
fi

npm run build:webplace

if [[ -n "${DEPLOY_LOCAL_DIR:-}" ]]; then
  mkdir -p "$DEPLOY_LOCAL_DIR/aulaChines"
  # Remove HTML export antigo na raiz de DEPLOY_LOCAL_DIR (layout pré-/aulaChines/)
  find "$DEPLOY_LOCAL_DIR" -maxdepth 1 -type f \( -name "*.html" -o -name "*.txt" \) ! -name "server.env" -delete 2>/dev/null || true
  rsync -av --delete ./out/ "$DEPLOY_LOCAL_DIR/aulaChines/"
  echo "Synced out/ → $DEPLOY_LOCAL_DIR/aulaChines/ (local)"
  echo ""
  echo "  Abrir o site:  cd \"$DEPLOY_LOCAL_DIR\" && python3 -m http.server 34901 -b 127.0.0.1"
  echo "  URL:           http://127.0.0.1:34901/aulaChines/"
  echo "  Ou:            ./start.sh --webplace  (usa a mesma árvore + porta 34901 por defeito)"
  echo ""
  echo "  Nota: export estático — /api/chat e tutor com LLM NÃO funcionam aqui."
  echo "  Para testar tutor + API localmente: npm run deploy:local:live"
else
  rsync -avz --delete -e ssh ./out/ "${REMOTE}:${REMOTE_DIR}/"
  echo "Synced out/ → ${REMOTE}:${REMOTE_DIR}/"
fi

if [[ "${DEPLOY_PUSH_SERVER_ENV:-0}" == "1" ]]; then
  if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
    echo "DEPLOY_PUSH_SERVER_ENV=1 but missing: $DEPLOY_ENV_FILE" >&2
    exit 1
  fi
  if [[ -n "${DEPLOY_LOCAL_DIR:-}" ]]; then
    cp -f "$DEPLOY_ENV_FILE" "$DEPLOY_LOCAL_DIR/server.env"
    echo "Copied server.env → $DEPLOY_LOCAL_DIR/server.env"
  else
    scp "$DEPLOY_ENV_FILE" "${REMOTE}:${REMOTE_DIR}/server.env"
    echo "Pushed server.env → ${REMOTE}:${REMOTE_DIR}/server.env"
  fi
fi
