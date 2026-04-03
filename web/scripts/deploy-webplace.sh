#!/usr/bin/env bash
set -euo pipefail
# Static export (basePath /aulaChines) → itcsVM (or local dir). Tutor/API não incluídos — usar deploy-node.sh + next start.
# O nginx em webplace.cc usa: location /aulaChines/ { alias /home/opc/projetos/chineseLearning/; }
# NÃO usar webplaceMain/site/aulaChines — esse path não é o que o servidor expõe.
#
# Overrides:
#   DEPLOY_WEBPLACE_HOST, DEPLOY_WEBPLACE_DIR  — SSH rsync target (default: itcsVM + /home/opc/projetos/chineseLearning)
#   DEPLOY_LOCAL_DIR                           — if set, rsync ./out/ here only (no SSH); local deploy smoke test
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
  mkdir -p "$DEPLOY_LOCAL_DIR"
  rsync -av --delete ./out/ "$DEPLOY_LOCAL_DIR/"
  echo "Synced out/ → $DEPLOY_LOCAL_DIR (local)"
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
