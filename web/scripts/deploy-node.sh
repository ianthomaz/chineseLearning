#!/usr/bin/env bash
set -euo pipefail
# LEGADO itcsVM1 — build NO REMOTO (npm ci + build:server). Não usar em itcsVM3 (E2.Micro).
# Produção itcsVM3: ./start.sh --prod  depois  ./start.sh --prod --upload  (ver deploy-prod.sh).
#
# Next.js com Route Handlers (tutor /api/chat) — nginx proxy de /aulaChines/ para 127.0.0.1:PORT.
#
# Requer no remoto: Node 20+, ficheiro server.env com LLM_API_URL e LLM_API_TOKEN.
# LLM_API_URL deve ser alcançável a partir do host remoto (ex. https://llm.webplace.cc), não 127.0.0.1
# salvo túnel explícito — ver ITCS/featureLLM/docs/MANUAL_INTEGRACAO.md § 1.1.
# Arranque: source server.env + PORT; start-server-stripped.mjs usa HOSTNAME (default 127.0.0.1) e PORT.
#
# Variáveis:
#   DEPLOY_NODE_HOST   (default: DEPLOY_WEBPLACE_HOST ou itcsVM1)
#   DEPLOY_NODE_DIR    (default: /home/opc/projetos/chineseLearning-app)
#   DEPLOY_NODE_PORT   (default: 34827) — mesmo valor no proxy_pass nginx
#   DEPLOY_NODE_RESTART_CMD — se definido, corre por SSH após o build (substitui o reload default).
#   DEPLOY_NODE_SKIP_PM2_RELOAD=1 — não corre o pm2 reload automático (VM sem PM2 ou outro nome de app).
#   DEPLOY_NODE_SKIP_CI=1 — não corre npm ci no remoto (só build:server). Use quando só mudaste
#     conteúdo/código e package-lock.json não mudou — mais rápido. Se o build falhar por deps, repete sem isto.

REMOTE="${DEPLOY_NODE_HOST:-${DEPLOY_WEBPLACE_HOST:-itcsVM1}}"
REMOTE_DIR="${DEPLOY_NODE_DIR:-/home/opc/projetos/chineseLearning-app}"
PORT="${DEPLOY_NODE_PORT:-34827}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_ENV_FILE="$WEB_DIR/deploy/server.env"

cd "$WEB_DIR"

if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  echo "Missing $DEPLOY_ENV_FILE — copy deploy/server.env.example and fill LLM_*." >&2
  exit 1
fi

echo "→ rsync sources → ${REMOTE}:${REMOTE_DIR}/"
# pdf-content/*.pdf is gitignored locally but present on your machine → uploaded here.
# public/downloads/*.pdf is excluded (copied on remote from pdf-content via prebuild:pdf before next build in build:server).
rsync -avz --delete -e ssh \
  --exclude node_modules \
  --exclude .next \
  --exclude out \
  --exclude .env.local \
  --exclude 'public/downloads/*.pdf' \
  ./ "${REMOTE}:${REMOTE_DIR}/"

echo "→ scp deploy/server.env"
scp "$DEPLOY_ENV_FILE" "${REMOTE}:${REMOTE_DIR}/server.env"

run_build() {
  ssh "$REMOTE" bash -s <<REMOTE_EOF
set -euo pipefail
cd "${REMOTE_DIR}"
if [[ "${DEPLOY_NODE_SKIP_CI:-0}" == "1" ]]; then
  echo "→ skip npm ci (DEPLOY_NODE_SKIP_CI=1 — lite deploy)"
else
  # Install before sourcing server.env: NODE_ENV=production there would make npm ci skip devDependencies
  # (tailwindcss, postcss, typescript) and next build would fail.
  npm ci
fi
export PORT=${PORT}
set -a
# shellcheck source=/dev/null
source ./server.env
set +a
npm run build:server
REMOTE_EOF
}

run_build

if [[ -n "${DEPLOY_NODE_RESTART_CMD:-}" ]]; then
  echo "→ DEPLOY_NODE_RESTART_CMD"
  ssh "$REMOTE" "bash -lc $(printf '%q' "$DEPLOY_NODE_RESTART_CMD")"
elif [[ "${DEPLOY_NODE_SKIP_PM2_RELOAD:-0}" != "1" ]]; then
  echo "→ pm2 reload chinese-learning-app (skip with DEPLOY_NODE_SKIP_PM2_RELOAD=1)"
  ssh "$REMOTE" "cd ${REMOTE_DIR} && pm2 reload chinese-learning-app --update-env"
else
  echo ""
  echo "Build feito. PM2 reload saltado. Arranca ou recarrega o processo manualmente, por exemplo:"
  echo "  cd $REMOTE_DIR && pm2 reload chinese-learning-app --update-env"
fi
