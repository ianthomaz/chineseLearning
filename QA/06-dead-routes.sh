#!/usr/bin/env bash
# Placeholder check: no dead-route catalogue is maintained for this site.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"
# shellcheck source=routes.sh
source "$QA_DIR/routes.sh"

qa_header "06 dead routes"
qa_require_server

count=0
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  count=$((count + 1))
  for candidate in "$path" "${path}/"; do
    code="$(qa_http_code GET "$candidate" || true)"
    qa_expect_code_re "GET $candidate" '404|410' "$code"
  done
done < <(qa_dead_pages)

if [[ "$count" -eq 0 ]]; then
  qa_skip "no dead routes configured"
fi

qa_finish
