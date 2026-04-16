#!/usr/bin/env bash
set -euo pipefail
# Estático como webplace: build out/ + http.server. Porta default 34901 (contrato: 34827 = só next dev).
# Override: PREVIEW_WEBPLACE_PORT=xxxx npm run preview:webplace

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PREVIEW_WEBPLACE_PORT:-34901}"

if command -v lsof >/dev/null 2>&1; then
  if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "" >&2
    echo "  Porta $PORT já está em uso (ex.: ./start.sh --webplace ou outro preview)." >&2
    echo "  Encerra esse processo ou: PREVIEW_WEBPLACE_PORT=outra npm run preview:webplace" >&2
    echo "" >&2
    exit 1
  fi
fi

cd "$WEB_DIR"
npm run build:webplace

ROOT="$(mktemp -d)"
cleanup() { rm -rf "$ROOT"; }
trap cleanup EXIT

mkdir -p "$ROOT/aulaChines"
rsync -a --delete ./out/ "$ROOT/aulaChines/"

echo ""
echo "  Preview estático (prefixo /aulaChines/, porta $PORT):"
echo "  → http://127.0.0.1:${PORT}/aulaChines/"
echo ""
echo "  Ctrl+C para parar. Tutor/API não existem neste modo estático."
echo ""

cd "$ROOT"
exec python3 -m http.server "$PORT" -b 127.0.0.1
