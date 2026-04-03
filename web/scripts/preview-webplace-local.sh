#!/usr/bin/env bash
set -euo pipefail
# Simula webplace.cc/aulaChines: build estático + servidor HTTP na MESMA porta do dev (34827).
# Para o next dev antes: se a porta estiver ocupada, o script avisa e sai.
# Outra porta só se precisares: PREVIEW_WEBPLACE_PORT=xxxx npm run preview:webplace

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PREVIEW_WEBPLACE_PORT:-34827}"

if command -v lsof >/dev/null 2>&1; then
  if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "" >&2
    echo "  Porta $PORT já está em uso (provavelmente npm run dev)." >&2
    echo "  Para esse processo e volta a correr: npm run preview:webplace" >&2
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
echo "  Preview estático (prefixo /aulaChines/, mesma porta que o dev):"
echo "  → http://127.0.0.1:${PORT}/aulaChines/"
echo ""
echo "  Ctrl+C para parar. Tutor/API não existem neste modo — só next dev + LLM."
echo ""

cd "$ROOT"
exec python3 -m http.server "$PORT" -b 127.0.0.1
