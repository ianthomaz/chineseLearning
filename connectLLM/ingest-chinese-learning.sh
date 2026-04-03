#!/usr/bin/env bash
set -euo pipefail
# Queue RAG ingest for chinese_learning using markdown under rag_knowledge/.
# Requires: LLM_API_URL, LLM_API_TOKEN (and jq). Loads web/.env.local if present.
#
# Usage (from repo root):
#   ./connectLLM/ingest-chinese-learning.sh
#
# The path in "sources" must be readable by the API process (host or container).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DOTENV="$ROOT/web/.env"
WEB_ENV_LOCAL="$ROOT/web/.env.local"

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  set -a
  # shellcheck source=/dev/null
  source "$f"
  set +a
}

load_env_file "$WEB_DOTENV"
load_env_file "$WEB_ENV_LOCAL"

: "${LLM_API_URL:?Add LLM_API_URL to web/.env or export it}"
: "${LLM_API_TOKEN:?Set LLM_API_TOKEN in web/.env.local (see web/.env.local.example)}"

LLM_API_URL="${LLM_API_URL%/}"

if [[ -n "${RAG_SOURCES_PATH:-}" ]]; then
  RAG_SOURCES="$RAG_SOURCES_PATH"
else
  RAG_SOURCES="$ROOT/rag_knowledge"
fi

if [[ ! -d "$RAG_SOURCES" ]]; then
  echo "RAG folder not found: $RAG_SOURCES" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Install jq: brew install jq" >&2
  exit 1
fi

echo "Checking API health: $LLM_API_URL/health"
curl -sf -H "Authorization: Bearer $LLM_API_TOKEN" "$LLM_API_URL/health" | jq . || {
  echo "Health check failed (wrong URL, token, or API down)." >&2
  exit 1
}

echo ""
echo "Queueing ingest: project_id=chinese_learning"
echo "  sources[0]=$RAG_SOURCES"
echo "  (this path must exist for the API server process — adjust RAG_SOURCES_PATH if using Docker)"
echo ""

PAYLOAD="$(jq -n \
  --arg id "chinese_learning" \
  --arg name "Chinese Learning" \
  --arg path "$RAG_SOURCES" \
  '{project_id:$id, name:$name, incremental:true, sources:[$path]}')"

curl -sS -X POST \
  -H "Authorization: Bearer $LLM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$LLM_API_URL/ingest" | jq .

echo ""
echo "Done. Indexing runs in the background on the API server. See connectLLM/RAG_PROJETOS_INGEST_ASK.md"
