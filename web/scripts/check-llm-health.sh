#!/usr/bin/env bash
set -euo pipefail
# Optional preflight before npm run dev. Loads web/.env then .env.local.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_DIR"

set -a
# shellcheck source=/dev/null
[[ -f .env ]] && source .env
# shellcheck source=/dev/null
[[ -f .env.local ]] && source .env.local
set +a

# Default = API Docker no mesmo Mac; produção/VM: exportar LLM_API_URL (ex. https://llm.webplace.cc — MANUAL_INTEGRACAO § 1.1).
URL="${LLM_API_URL:-http://127.0.0.1:28471}"
URL="${URL%/}"

if curl -sf -m 5 "${URL}/health" >/dev/null; then
  echo "LLM API OK: ${URL}/health"
  exit 0
fi

echo "" >&2
echo "  LLM API não respondeu em ${URL}/health" >&2
echo "  Arranca o Docker em ITCS/featureLLM (porta 28471) ou ajusta LLM_API_URL em .env / .env.local." >&2
echo "" >&2
exit 1
