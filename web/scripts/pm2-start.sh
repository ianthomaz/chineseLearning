#!/usr/bin/env bash
set -euo pipefail
# PM2: loads server.env (LLM_*, PORT, HOSTNAME) then runs the production Node server.
# Usage on host:
#   cd /path/to/chineseLearning-app && pm2 start scripts/pm2-start.sh --name chinese-learning-app

WEB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WEB_ROOT"

if [[ ! -f ./server.env ]]; then
  echo "Missing $WEB_ROOT/server.env (copy from deploy or scp from local deploy:node)." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source ./server.env
set +a

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-34827}"
# Default loopback; production behind Docker edge nginx often needs 0.0.0.0 (see server.env.example).
export HOSTNAME="${HOSTNAME:-127.0.0.1}"

exec node "$WEB_ROOT/scripts/start-server-stripped.mjs"
