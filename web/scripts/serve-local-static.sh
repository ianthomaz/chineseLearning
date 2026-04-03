#!/usr/bin/env bash
set -euo pipefail
# Serve o export de deploy:local (basePath /aulaChines). Corre deploy:local antes se a pasta não existir.
#
#   npm run serve:local
#   DEPLOY_LOCAL_DIR=/caminho PORT=34902 npm run serve:local

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIR="${DEPLOY_LOCAL_DIR:-/tmp/chineseLearning-webplace-out}"
PORT="${PORT:-34901}"

if [[ ! -d "$DIR/aulaChines" ]]; then
  echo "→ Sem $DIR/aulaChines — a correr deploy:local…" >&2
  (cd "$WEB_DIR" && export DEPLOY_LOCAL_DIR="$DIR" && npm run deploy:local)
fi

echo ""
echo "  → http://127.0.0.1:${PORT}/aulaChines/"
echo "  Ctrl+C para parar."
echo ""
cd "$DIR"
exec python3 -m http.server "$PORT" -b 127.0.0.1
