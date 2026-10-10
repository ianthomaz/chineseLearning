#!/usr/bin/env bash
set -euo pipefail
# Production upload to small shared VM (itcsVM3 E2.Micro).
# Ready script — only run when YOU invoke it (agent must not run by default).
#
# !!! RESPECT THE SERVER (see also start.sh header) !!!
# itcsVM3 has very little RAM. Remote npm ci HAS already taken the VM down (sep 2026).
# Default upload is MINIMAL only: rsync + server.env (+ optional pm2 restart).
# NEVER next build on the VM. NEVER npm ci unless the operator sets
# DEPLOY_PROD_FORCE_NPM_CI=1 on purpose (bootstrap / broken node_modules only).
# SEED only with DEPLOY_PROD_SEED_CONTENT=1.
#
# Full flow (repo root):
#   1. ./start.sh --prod              — sync env + validate + LOCAL build (never next build on VM)
#   2. ./start.sh --prod --upload     — this script (rsync + server.env; no remote install)
#   3. npm run remote:handshake        — validate LLM from the VM
#
# Step 2 alternative: cd web && npm run deploy:prod
#
# Env overrides:
#   DEPLOY_PROD_HOST / DEPLOY_NODE_HOST     default: itcsVM3
#   DEPLOY_PROD_DIR / DEPLOY_NODE_DIR       default: /home/opc/projetos/chineseLearning-app
#   DEPLOY_PROD_SKIP_SSH_CHECK=1            skip pre-flight SSH (not recommended)
#   DEPLOY_PROD_FORCE_NPM_CI=1              ONLY then run remote npm ci (can OOM the VM)
#   DEPLOY_PROD_RESTART=1                   pm2 reload after upload (default: off — empty/new hosts)
#   DEPLOY_PROD_SEED_CONTENT=1              remote fill-empty seed (heavy enough — only if asked)
#   DEPLOY_PROD_SYNC_PHRASES=1              upsert phrase bank from phrases.json (light; safe after rsync)
#   DEPLOY_PROD_PM2_NAME                    default: chinese-learning-app
#
# Removed: DEPLOY_PROD_SKIP_NPM_CI (skip is now the default; do not reintroduce opt-out).

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
echo "  Build: LOCAL (.next/ + data/app-library/) · remoto: sem next build · env: server.env"
echo ""

if [[ "${DEPLOY_PROD_SKIP_SSH_CHECK:-0}" != "1" ]]; then
  echo "→ SSH handshake…"
  if ! ssh -o BatchMode=yes -o ConnectTimeout=25 "$REMOTE" 'echo "  SSH OK — $(hostname)"'; then
    echo "  ERRO: SSH falhou. Para aqui — resolve o servidor antes de repetir." >&2
    exit 1
  fi
  echo ""
fi

echo "→ rsync (código + .next/ + data/app-library; sem node_modules; preserva SQLite remoto)…"
# pdf-content/*.pdf is gitignored locally but uploaded when present.
# NEVER sync local phrase-game.sqlite — prod holds users/events/lessons.
# DO sync data/app-library/ (library pack for the iOS app API — built locally).
rsync -avz --delete -e ssh \
  --exclude node_modules \
  --exclude out \
  --exclude .env.local \
  --exclude 'data/*.sqlite' \
  --exclude 'data/*.sqlite-*' \
  --exclude 'data/*.sqlite-journal' \
  --exclude 'data/*.sqlite-wal' \
  --exclude 'data/*.sqlite-shm' \
  --exclude 'public/downloads/*.pdf' \
  ./ "${REMOTE}:${REMOTE_DIR}/"

echo ""
echo "→ scp server.env → ${REMOTE}:${REMOTE_DIR}/server.env"
scp -q "$DEPLOY_ENV_FILE" "${REMOTE}:${REMOTE_DIR}/server.env"
echo "  OK."
echo ""

if [[ -n "${DEPLOY_PROD_SKIP_NPM_CI:-}" ]]; then
  echo "AVISO: DEPLOY_PROD_SKIP_NPM_CI is obsolete — remote npm ci is skipped by default." >&2
  echo "       To force a remote install (risky): DEPLOY_PROD_FORCE_NPM_CI=1" >&2
fi

if [[ "${DEPLOY_PROD_FORCE_NPM_CI:-0}" == "1" ]]; then
  echo "→ Remoto: npm ci --omit=dev (DEPLOY_PROD_FORCE_NPM_CI=1 — can OOM itcsVM3)…"
  ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_NPM'
set -euo pipefail
DIR="$1"
cd "$DIR"
# Do not source server.env before npm ci — NODE_ENV=production would skip devDeps if we ever need them.
npm ci --omit=dev
echo "  OK — node_modules (production)."
REMOTE_NPM
  echo ""
else
  echo "→ npm ci remoto omitido (default). Build/deps are local-only."
  echo "  Broken remote node_modules? Prefer shipping a linux node_modules from the Mac,"
  echo "  or only then: DEPLOY_PROD_FORCE_NPM_CI=1 ./start.sh --prod --upload --skip-build"
  echo ""
fi

if [[ "${DEPLOY_PROD_RESTART:-0}" == "1" ]]; then
  echo "→ pm2 restart ${PM2_NAME} (delete + start — re-sources server.env)…"
  ssh "$REMOTE" bash -s "$REMOTE_DIR" "$PM2_NAME" <<'REMOTE_PM2'
set -euo pipefail
DIR="$1"
NAME="$2"
cd "$DIR"
pm2 delete "$NAME" 2>/dev/null || true
pm2 start scripts/pm2-start.sh --name "$NAME"
pm2 save
REMOTE_PM2
  echo "  OK."
else
  echo "→ PM2 restart omitido (default em host novo/partilhado)."
  echo "  Para arrancar ou recarregar manualmente no servidor:"
  echo "    cd ${REMOTE_DIR} && pm2 delete ${PM2_NAME} 2>/dev/null; pm2 start scripts/pm2-start.sh --name ${PM2_NAME} && pm2 save"
  echo "  Ou repetir deploy com: DEPLOY_PROD_RESTART=1 ./start.sh --prod --upload --skip-build"
fi

if [[ "${DEPLOY_PROD_SYNC_PHRASES:-0}" == "1" ]]; then
  echo ""
  echo "→ Remoto: sync phrase bank from phrases.json (upsert by id; leve)…"
  ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_PHRASES'
set -euo pipefail
DIR="$1"
cd "$DIR"
set -a
# shellcheck disable=SC1091
[[ -f ./server.env ]] && source ./server.env
set +a
node scripts/sync-phrase-bank-from-json.mjs
REMOTE_PHRASES
  echo "  OK."
fi

if [[ "${DEPLOY_PROD_SEED_CONTENT:-0}" == "1" ]]; then
  echo ""
  echo "→ Remoto: seed fill-empty + rebuild app-library (leve; sem next build)…"
  echo "  Nota: SQLite de users/aulas intacto. Pack do app também já veio no rsync (data/app-library/)."
  ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_SEED'
set -euo pipefail
DIR="$1"
cd "$DIR"
# Avoid NODE_ENV from server.env skipping anything unexpected; seed only needs SITE_DB path.
set -a
# shellcheck disable=SC1091
[[ -f ./server.env ]] && source ./server.env
set +a
npm run seed:content
REMOTE_SEED
  echo "  OK."
fi

echo ""
echo "  Deploy prod concluído (artefactos + server.env no remoto)."
echo "  SQLite remoto preservado (*.sqlite excluídos do rsync)."
echo "  Pack app: data/app-library/ sobe do Mac (build local via build:app-library)."
echo "  Seed remoto é fill-empty. Forçar reimport editorial:"
echo "    ssh ${REMOTE} 'cd ${REMOTE_DIR} && FORCE_RESEED=1 npm run seed:content'"
echo "  Ou: DEPLOY_PROD_SEED_CONTENT=1 ./start.sh --prod --upload"
echo "  Editar conteúdo: npm run db:studio (local) — ver docs/07_conteudo_dados.md"
echo "  Nginx: learnchinese.today → 127.0.0.1:\${PORT} (ver web/deploy/nginx-learnchinese.conf.example)."
