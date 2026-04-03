#!/usr/bin/env bash
set -euo pipefail
# Deploy local COM Route Handlers: build servidor + Node server (scripts/start-server-stripped.mjs; tutor chama /aulaChines/api/chat).
# O export estático (deploy:local) NÃO serve POST /api/chat — usar este script para testar LLM.
#
# Porta default 34902 (evita conflito com npm run dev em 34827).
# Carrega web/.env.local se existir (LLM_API_TOKEN, LLM_API_URL).
#
#   npm run deploy:local:live
#   npm run deploy:local:with-api   (alias)
#   PORT=34903 npm run deploy:local:live
# LLM_API_URL: web/.env (default localhost) ou .env.local — https://llm.webplace.cc ou Docker :28471

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_DIR"

PORT="${PORT:-34902}"

if [[ "${SKIP_PORT_CHECK:-0}" != "1" ]] && lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Porta $PORT em uso. Usa ./start.sh --local (liberta a porta), ou PORT=34903, ou SKIP_PORT_CHECK=1." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
[[ -f .env ]] && source .env
# shellcheck source=/dev/null
[[ -f .env.local ]] && source .env.local
set +a

if [[ -z "${LLM_API_TOKEN:-}" ]]; then
  echo "Falta LLM_API_TOKEN (web/.env.local). O tutor devolve 500 sem ele." >&2
  exit 1
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
