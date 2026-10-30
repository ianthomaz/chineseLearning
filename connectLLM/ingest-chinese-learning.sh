#!/usr/bin/env bash
set -euo pipefail
# Queue RAG ingest for chinese_learning using markdown under rag_knowledge/
# (hand-written files + generated/). Rebuild local markdown first:
#   cd web && npm run build:rag
# Requires: LLM_API_URL, LLM_API_TOKEN (and jq). Loads web/.env.local if present.
#
# Usage (from repo root):
#   ./connectLLM/ingest-chinese-learning.sh
#
# The path in "sources" must be readable by the API process (host or container).
#
# --- LLM gap (API / llm_api, not this repo) ---
# [ ] llm_api has no scripts/seed_chinese_learning.py (unlike bikeanjo / webplacecc).
# After a Postgres wipe on the API host, GET /projects loses chinese_learning even if
# Chroma files still exist under the API data dir. This script re-registers the project
# via POST /ingest (+ sources). Until a real seed exists on the API side, treat a missing
# project as an API registry failure, not a missing rag_knowledge/ tree here.
# Path trap: this laptop uses ~/Projects/chineseLearning; Docker on mini62 often mounts
# ~/Documents/projects — RAG_SOURCES_PATH must be a path the *container* can read.

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
echo "Checking registry: GET /projects for chinese_learning…"
if curl -sf -m 20 -H "Authorization: Bearer $LLM_API_TOKEN" "$LLM_API_URL/projects" \
  | jq -e '.projects[] | select(.project_id=="chinese_learning")' >/dev/null 2>&1; then
  echo "  OK — project already registered."
else
  echo "  MISSING — API registry has no chinese_learning (common after Postgres wipe)." >&2
  echo "  Cause on LLM side: no seed_chinese_learning.py in llm_api; Chroma alone is not enough." >&2
  echo "  This POST /ingest with sources will try to re-create the project row." >&2
fi

case "$RAG_SOURCES" in
  */Projects/chineseLearning/*|*/Projects/chineseLearning)
    echo ""
    echo "  Aviso: path sob ~/Projects/… — confira se o Docker da API monta esse path." >&2
    echo "  No mini62 o compose costuma montar ~/Documents/projects, não ~/Projects." >&2
    ;;
esac

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
