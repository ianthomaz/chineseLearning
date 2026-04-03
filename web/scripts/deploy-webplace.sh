#!/usr/bin/env bash
set -euo pipefail
# Static export with basePath /aulaChines → webplace nginx (pcvelho).
REMOTE="${DEPLOY_WEBPLACE_HOST:-pcvelho}"
REMOTE_DIR="${DEPLOY_WEBPLACE_DIR:-/Projects/017_vm-webplace-infra/projetos/webplaceMain/site/aulaChines}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$WEB_DIR"
npm run build:webplace
rsync -avz --delete -e ssh ./out/ "${REMOTE}:${REMOTE_DIR}/"

echo "Deployed to https://webplace.cc/aulaChines/ (if DNS and nginx point here)."
