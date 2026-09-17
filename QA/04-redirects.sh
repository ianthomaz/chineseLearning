#!/usr/bin/env bash
# Alias domain → canonical host. Production only.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "04 redirects"

if ! qa_is_prod_target; then
  qa_skip "learnchinese.page redirect (not --target prod)"
  qa_finish
fi

check_alias() {
  local from="$1"
  local expect_host="$2"
  local hdr code loc
  hdr="$(qa_tmp)"
  QA_CURL_NO_FOLLOW=1
  code="$(curl -sS --max-time 20 -A "learnchinese-qa/1.0" -D "$hdr" -o /dev/null -w '%{http_code}' "$from" || true)"
  unset QA_CURL_NO_FOLLOW
  loc="$(grep -i '^location:' "$hdr" | head -1 | tr -d '\r' | sed 's/[Ll]ocation:[[:space:]]*//')"
  rm -f "$hdr"
  if [[ "$code" =~ ^301$ ]] && grep -q "$expect_host" <<<"$loc"; then
    qa_pass "$from → $loc ($code)"
  elif [[ "$code" =~ ^30[278]$ ]] && grep -q "$expect_host" <<<"$loc"; then
    qa_pass "$from → $loc ($code, not 301)"
  else
    qa_fail "$from expected 301 to $expect_host (got $code ${loc:-no location})"
  fi
}

check_alias "https://learnchinese.page/" "learnchinese.today"
check_alias "http://learnchinese.page/" "learnchinese.today"

qa_finish
