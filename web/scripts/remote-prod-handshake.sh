#!/usr/bin/env bash
set -euo pipefail
# Run LLM health + POST /edu/chat on the deploy host using the same paths as deploy:node.
# Copies web/deploy/server.env to a temp file on the remote, sources it, then deletes it.
#
#   cd web && npm run remote:handshake
#   DEPLOY_NODE_HOST=itcsVM DEPLOY_NODE_DIR=/path npm run remote:handshake
#
# Requires: ssh + scp to the host; on the remote: curl (and jq optional).

REMOTE="${DEPLOY_NODE_HOST:-${DEPLOY_WEBPLACE_HOST:-itcsVM}}"
REMOTE_DIR="${DEPLOY_NODE_DIR:-/home/opc/projetos/chineseLearning-app}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_ENV_FILE="$WEB_DIR/deploy/server.env"

cd "$WEB_DIR"

if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  echo "Missing $DEPLOY_ENV_FILE — copy deploy/server.env.example and fill LLM_*." >&2
  exit 1
fi

echo "→ SSH handshake on ${REMOTE} (LLM via server.env; app dir hint: ${REMOTE_DIR})"
REMOTE_TMP="$(ssh "$REMOTE" mktemp /tmp/chinese-learning-handshake.XXXXXX)"
scp -q "$DEPLOY_ENV_FILE" "${REMOTE}:${REMOTE_TMP}"

ssh "$REMOTE" bash -s "$REMOTE_TMP" "$REMOTE_DIR" <<'REMOTE_SCRIPT'
set -euo pipefail
ENVFILE="$1"
APP_DIR="$2"
set -a
# shellcheck source=/dev/null
source "$ENVFILE"
set +a
rm -f "$ENVFILE"

: "${LLM_API_URL:?Missing LLM_API_URL in server.env}"
: "${LLM_API_TOKEN:?Missing LLM_API_TOKEN in server.env}"
export LLM_API_URL="${LLM_API_URL%/}"

echo "→ Remote: GET /health …"
if ! curl -sf -m 25 -H "Authorization: Bearer $LLM_API_TOKEN" "$LLM_API_URL/health" >/dev/null; then
  echo "  ERRO: $LLM_API_URL/health não respondeu a partir deste host." >&2
  echo "  Em VM na nuvem, LLM_API_URL não deve ser 127.0.0.1 salvo túnel (ver MANUAL_INTEGRACAO.md § 1.1)." >&2
  echo "  Usa normalmente: https://llm.webplace.cc (HTTPS) ou http://<tailnet-ip>:28471 (Tailscale)." >&2
  exit 1
fi
echo "  OK."

echo "→ Remote: POST /edu/chat (timeout 120s) …"
RESP="$(curl -sS -m 120 -X POST "$LLM_API_URL/edu/chat" \
  -H "Authorization: Bearer $LLM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Handshake remoto: saudação mínima em chinês.","level":"HSK1","language":"zh-CN"}')"

if command -v jq >/dev/null 2>&1; then
  echo "$RESP" | jq -e '(.full_reply_text // .reply | type) == "string" and ((.full_reply_text // .reply | length) > 0)' >/dev/null
else
  echo "$RESP" | grep -qE '"full_reply_text"\s*:\s*"[^"]+"' || echo "$RESP" | grep -qE '"reply"\s*:\s*"[^"]+"'
fi
echo "  OK."

if [[ -f "$APP_DIR/package.json" ]]; then
  echo "→ Remote: app tree present at $APP_DIR (Node $(command -v node >/dev/null && node -p process.version || echo '?'))."
else
  echo "→ Remote: $APP_DIR ainda sem package.json (normal antes do primeiro deploy:node)."
fi
REMOTE_SCRIPT

echo ""
echo "  Handshake remoto concluído."
