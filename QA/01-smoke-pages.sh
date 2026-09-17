#!/usr/bin/env bash
# GET every public, gated, and curator page; crawl study indexes for block routes.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"
# shellcheck source=routes.sh
source "$QA_DIR/routes.sh"

qa_header "01 smoke pages"
qa_require_server

check_page() {
  local path="$1"
  local expect="${2:-200}"
  local tmp code
  tmp="$(qa_tmp)"
  code="$(qa_fetch "$path" "$tmp" || true)"
  if [[ "$code" != "$expect" ]]; then
    qa_fail "GET $path (expected $expect, got ${code:-empty})"
    rm -f "$tmp"
    return
  fi
  local size
  size="$(wc -c < "$tmp" | tr -d ' ')"
  if [[ "$expect" == "200" && "$size" -lt 200 ]]; then
    qa_fail "GET $path (200 but body too small: $size bytes)"
    rm -f "$tmp"
    return
  fi
  qa_pass "GET $path ($code, ${size}B)"
  rm -f "$tmp"

  local head
  head="$(qa_http_code HEAD "$path" || true)"
  if [[ "$head" =~ ^[23] || "$head" == "405" || "$head" == "403" || "$head" == "501" ]]; then
    qa_pass "HEAD $path ($head)"
  else
    qa_fail "HEAD $path (got ${head:-empty})"
  fi
}

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  check_page "$path" 200
done < <(qa_public_pages)

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  check_page "$path" 200
done < <(qa_gated_pages)

if qa_is_static_target; then
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    local_code="$(qa_http_code GET "$path" || true)"
    qa_expect_code_re "GET $path (static: no curator page)" '404|405' "$local_code"
  done < <(qa_curator_pages)
else
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    check_page "$path" 200
  done < <(qa_curator_pages)
fi

extract_block_paths() {
  local html="$1"
  local mode="$2"
  grep -oE "/${mode}/[0-9]+" "$html" 2>/dev/null | sort -u || true
}

qa_header "01 block pages from indexes"
block_count=0
while IFS= read -r index; do
  [[ -z "$index" ]] && continue
  mode="${index#/}"
  tmp="$(qa_tmp)"
  code="$(qa_fetch "$index" "$tmp" || true)"
  if [[ "$code" != "200" ]]; then
    qa_fail "index $index for block crawl ($code)"
    rm -f "$tmp"
    continue
  fi
  found=0
  while IFS= read -r bpath; do
    [[ -z "$bpath" ]] && continue
    found=$((found + 1))
    block_count=$((block_count + 1))
    check_page "$bpath" 200
  done < <(extract_block_paths "$tmp" "$mode")
  if [[ "$found" -eq 0 ]]; then
    qa_fail "no /$mode/N links in $index HTML"
  else
    qa_pass "$index listed $found block routes"
  fi
  rm -f "$tmp"
done < <(qa_index_pages)

qa_info "block pages checked: $block_count"
qa_finish
