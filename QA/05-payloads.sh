#!/usr/bin/env bash
# Uncompressed HTML size vs budgets from docs/08_produto_observabilidade.md (with slack).
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"
# shellcheck source=routes.sh
source "$QA_DIR/routes.sh"

qa_header "05 payloads"
qa_require_server

while read -r path budget; do
  [[ -z "${path:-}" ]] && continue
  read -r code size <<<"$(qa_body_size "$path")"
  if [[ "$code" != "200" ]]; then
    qa_fail "GET $path for payload ($code)"
    continue
  fi
  read -r gcode gsize <<<"$(qa_gzip_size "$path")"
  qa_info "$path uncompressed=${size}B gzip_wire=${gsize}B budget=${budget}B"
  if [[ "$size" -le "$budget" ]]; then
    qa_pass "$path ${size}B <= ${budget}B"
  else
    qa_fail "$path ${size}B exceeds budget ${budget}B"
  fi
done < <(qa_payload_budgets)

qa_finish
