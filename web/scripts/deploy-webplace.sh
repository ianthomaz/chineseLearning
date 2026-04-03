#!/usr/bin/env bash
set -euo pipefail
# Static export (basePath /aulaChines) → itcsVM.
# O nginx em webplace.cc usa: location /aulaChines/ { alias /home/opc/projetos/chineseLearning/; }
# NÃO usar webplaceMain/site/aulaChines — esse path não é o que o servidor expõe.
# Override: DEPLOY_WEBPLACE_HOST, DEPLOY_WEBPLACE_DIR

REMOTE="${DEPLOY_WEBPLACE_HOST:-itcsVM}"
REMOTE_DIR="${DEPLOY_WEBPLACE_DIR:-/home/opc/projetos/chineseLearning}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$WEB_DIR"
npm run build:webplace
rsync -avz --delete -e ssh ./out/ "${REMOTE}:${REMOTE_DIR}/"

echo "Synced out/ → ${REMOTE}:${REMOTE_DIR}/"
