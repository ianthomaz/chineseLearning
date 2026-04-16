#!/usr/bin/env bash
set -euo pipefail
# Deploy local (Node + Route Handlers). Contrato de portas e URLs: ../../docs/04_operacao_local.md
# Carrega web/.env.local (LLM_API_TOKEN, LLM_API_URL). Entrada: npm run deploy:local:live (alias deploy:local:with-api).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_DIR"

PORT="${PORT:-34902}"

if [[ "${SKIP_PORT_CHECK:-0}" != "1" ]] && lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT in use — see ../../docs/04_operacao_local.md (free the port or SKIP_PORT_CHECK=1 as exception)." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
[[ -f .env ]] && source .env
# shellcheck source=/dev/null
[[ -f .env.local ]] && source .env.local
set +a

if [[ -z "${LLM_API_TOKEN:-}" && "${SKIP_LLM_CHECKS:-}" != "1" ]]; then
  echo "Falta LLM_API_TOKEN (web/.env.local). O tutor devolve 500 sem ele. Ou: SKIP_LLM_CHECKS=1 npm run deploy:local:live" >&2
  exit 1
fi
if [[ "${SKIP_LLM_CHECKS:-}" == "1" ]]; then
  echo "→ SKIP_LLM_CHECKS=1 — a subir sem token LLM (API/tutor podem falhar)." >&2
fi

if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  echo "→ SKIP_BUILD=1 — a usar .next existente (garante que corresponde a build:server recente)."
else
  echo "→ build:server (com /aulaChines + Route Handlers /api)…"
  npm run build:server
fi

echo ""
echo "  Site + API:  http://127.0.0.1:${PORT}/aulaChines"
echo "  Tutor:       http://127.0.0.1:${PORT}/aulaChines/tutor"
echo "  Ctrl+C para parar."
echo ""

export PORT
exec npm run start:server
