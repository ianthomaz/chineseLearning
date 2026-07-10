#!/usr/bin/env bash
set -euo pipefail
# Upload produção para VM pequena partilhada (itcsVM3 E2.Micro).
# Script pronto — só corre quando TU invocas (agente não executa por defeito).
#
# Fluxo completo (na raiz do repo):
#   1. ./start.sh --prod              — sync env + validar + build local
#   2. ./start.sh --prod --upload     — este script (rsync + server.env + npm ci --omit=dev)
#   3. npm run remote:handshake        — validar LLM a partir da VM
#
# Alternativa passo 2: cd web && npm run deploy:prod
#
# Overrides (env):
#   DEPLOY_PROD_HOST / DEPLOY_NODE_HOST     default: itcsVM3
#   DEPLOY_PROD_DIR / DEPLOY_NODE_DIR       default: /home/opc/projetos/chineseLearning-app
#   DEPLOY_PROD_SKIP_SSH_CHECK=1            skip pre-flight SSH (not recommended)
#   DEPLOY_PROD_SKIP_NPM_CI=1               skip remote npm ci (only rsync + server.env)
#   DEPLOY_PROD_RESTART=1                   pm2 reload after upload (default: off — empty/new hosts)
#   DEPLOY_PROD_PM2_NAME                    default: chinese-learning-app

REMOTE="${DEPLOY_PROD_HOST:-${DEPLOY_NODE_HOST:-itcsVM3}}"
REMOTE_DIR="${DEPLOY_PROD_DIR:-${DEPLOY_NODE_DIR:-/home/opc/projetos/chineseLearning-app}}"
PM2_NAME="${DEPLOY_PROD_PM2_NAME:-chinese-learning-app}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/.." && pwd)"
DEPLOY_ENV_FILE="$WEB_DIR/deploy/server.env"
NEXT_DIR="$WEB_DIR/.next"
CRED="$REPO_ROOT/local/credentials/credentials.json"

if [[ -f "$CRED" ]] && command -v node >/dev/null 2>&1; then
  REMOTE="${DEPLOY_PROD_HOST:-${DEPLOY_NODE_HOST:-$(node -e "const d=require('$CRED').deployment||{};process.stdout.write(d.prod_ssh_host||'itcsVM3');")}}"
  REMOTE_DIR="${DEPLOY_PROD_DIR:-${DEPLOY_NODE_DIR:-$(node -e "const d=require('$CRED').deployment||{};process.stdout.write(d.prod_remote_dir||'/home/opc/projetos/chineseLearning-app');")}}"
fi

cd "$WEB_DIR"

if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  echo "Missing $DEPLOY_ENV_FILE — run: node scripts/sync-env-from-credentials.mjs" >&2
  echo "  or copy deploy/server.env.example → deploy/server.env" >&2
  exit 1
fi

if [[ ! -d "$NEXT_DIR" ]]; then
  echo "Missing $NEXT_DIR — run ./start.sh --prod (build local) before deploy." >&2
  exit 1
fi

if [[ ! -f "$NEXT_DIR/BUILD_ID" ]]; then
  echo "Invalid .next (no BUILD_ID) — run ./start.sh --prod to rebuild locally." >&2
  exit 1
fi

echo "→ Produção: ${REMOTE}:${REMOTE_DIR}"
echo "  Build: local (.next/) · remoto: sem next build · env: server.env"
echo ""

if [[ "${DEPLOY_PROD_SKIP_SSH_CHECK:-0}" != "1" ]]; then
  echo "→ SSH handshake…"
  if ! ssh -o BatchMode=yes -o ConnectTimeout=25 "$REMOTE" 'echo "  SSH OK — $(hostname)"'; then
    echo "  ERRO: SSH falhou. Para aqui — resolve o servidor antes de repetir." >&2
    exit 1
  fi
  echo ""
fi

echo "→ rsync (código + .next/, sem node_modules; preserva SQLite remoto)…"
# pdf-content/*.pdf is gitignored locally but uploaded when present.
# NEVER sync local data/*.sqlite — prod holds users/events/lessons; editorial
# content is re-seeded on the server via a separate step or SITE_DB outside tree.
rsync -avz --delete -e ssh \
  --exclude node_modules \
  --exclude out \
  --exclude .env.local \
  --exclude data \
  --exclude '*.sqlite' \
  --exclude 'public/downloads/*.pdf' \
  ./ "${REMOTE}:${REMOTE_DIR}/"

echo ""
echo "→ scp server.env → ${REMOTE}:${REMOTE_DIR}/server.env"
scp -q "$DEPLOY_ENV_FILE" "${REMOTE}:${REMOTE_DIR}/server.env"
echo "  OK."
echo ""

if [[ "${DEPLOY_PROD_SKIP_NPM_CI:-0}" == "1" ]]; then
  echo "→ npm ci remoto omitido (DEPLOY_PROD_SKIP_NPM_CI=1)."
else
  echo "→ Remoto: npm ci --omit=dev (só dependências de runtime, sem build)…"
  ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_NPM'
set -euo pipefail
DIR="$1"
cd "$DIR"
# Do not source server.env before npm ci — NODE_ENV=production would skip devDeps if we ever need them.
npm ci --omit=dev
echo "  OK — node_modules (production)."
REMOTE_NPM
  echo ""
fi

if [[ "${DEPLOY_PROD_RESTART:-0}" == "1" ]]; then
  echo "→ pm2 reload ${PM2_NAME}…"
  ssh "$REMOTE" "cd ${REMOTE_DIR} && pm2 reload ${PM2_NAME} --update-env"
  echo "  OK."
else
  echo "→ PM2 reload omitido (default em host novo/partilhado)."
  echo "  Para arrancar ou recarregar manualmente no servidor:"
  echo "    cd ${REMOTE_DIR} && pm2 start scripts/pm2-start.sh --name ${PM2_NAME}"
  echo "    cd ${REMOTE_DIR} && pm2 reload ${PM2_NAME} --update-env"
  echo "  Ou repetir deploy com: DEPLOY_PROD_RESTART=1 ./start.sh --prod --upload --skip-build"
fi

if [[ "${DEPLOY_PROD_SEED_CONTENT:-0}" == "1" ]]; then
  echo ""
  echo "→ Remoto: npm run seed:content (só tabelas editoriais; users/aulas intactos)…"
  ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_SEED'
set -euo pipefail
DIR="$1"
cd "$DIR"
npm run seed:content
REMOTE_SEED
  echo "  OK."
fi

echo ""
echo "  Deploy prod concluído (artefactos + server.env no remoto)."
echo "  SQLite remoto preservado (data/ e *.sqlite excluídos do rsync)."
echo "  Para actualizar só o conteúdo editorial no servidor (sem apagar users/aulas):"
echo "    ssh ${REMOTE} 'cd ${REMOTE_DIR} && npm run seed:content'"
echo "  Ou: DEPLOY_PROD_SEED_CONTENT=1 ./start.sh --prod --upload"
echo "  Nginx: proxy_pass /aulaChines/ → 127.0.0.1:\${PORT} (ver docs/06_deploy.md)."
