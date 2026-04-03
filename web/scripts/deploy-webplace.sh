#!/usr/bin/env bash
set -euo pipefail
# Static export (basePath /aulaChines) → itcsVM, pasta servida pelo nginx do webplaceMain.
# Override se necessário:
#   DEPLOY_WEBPLACE_HOST  (default: itcsVM — usa o teu Host do ~/.ssh/config)
#   DEPLOY_WEBPLACE_DIR   (default: caminho abaixo)

REMOTE="${DEPLOY_WEBPLACE_HOST:-itcsVM}"
REMOTE_DIR="${DEPLOY_WEBPLACE_DIR:-/home/opc/projetos/webplaceMain/site/aulaChines}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$WEB_DIR"
npm run build:webplace
rsync -avz --delete -e ssh ./out/ "${REMOTE}:${REMOTE_DIR}/"

echo "Synced out/ → ${REMOTE}:${REMOTE_DIR}/"
