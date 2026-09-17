#!/usr/bin/env bash
# Public and auth-gated APIs. No write POSTs against production.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "02 smoke APIs"
qa_require_server

if qa_is_static_target; then
  qa_info "static export: /api routes must be absent"
  for path in \
    /api/phrase-game/bank \
    /api/auth/session \
    /api/game/progress \
    /api/chat \
    /api/lessons \
    /api/app/content/manifest
  do
    code="$(qa_http_code GET "$path" || true)"
    qa_expect_code_re "GET $path (static)" '404|405' "$code"
  done
  qa_finish
fi

tmp="$(qa_tmp)"
code="$(qa_fetch /api/phrase-game/bank "$tmp" -H 'Accept-Encoding: gzip' || true)"
if [[ "$code" != "200" ]]; then
  qa_fail "GET /api/phrase-game/bank ($code)"
else
  qa_pass "GET /api/phrase-game/bank ($code)"
  hdrfile="$(qa_tmp)"
  qa_fetch_headers /api/phrase-game/bank "$hdrfile" -H 'Accept-Encoding: gzip' >/dev/null || true
  if grep -qi 'content-encoding: gzip' "$hdrfile"; then
    qa_pass "phrase bank Content-Encoding: gzip"
  else
    qa_fail "phrase bank missing gzip Content-Encoding"
  fi
  rm -f "$hdrfile"
  unpacked="$(qa_tmp)"
  if gzip -dc "$tmp" > "$unpacked" 2>/dev/null; then
    if grep -q '"phrases"' "$unpacked" && grep -q '"count"' "$unpacked"; then
      qa_pass "phrase bank JSON has phrases + count"
    else
      qa_fail "phrase bank JSON missing phrases/count"
    fi
  else
    # Some stacks already decode; body may be raw JSON
    if grep -q '"phrases"' "$tmp"; then
      qa_pass "phrase bank JSON has phrases (already decoded)"
    else
      qa_fail "phrase bank body is not gzip JSON"
    fi
  fi
  rm -f "$unpacked"
fi
rm -f "$tmp"

# ETag / 304
hdrfile="$(qa_tmp)"
qa_fetch_headers /api/phrase-game/bank "$hdrfile" -H 'Accept-Encoding: gzip' >/dev/null || true
etag="$(grep -i '^etag:' "$hdrfile" | head -1 | sed 's/[Ee][Tt]ag:[[:space:]]*//' | tr -d '\r')"
rm -f "$hdrfile"
if [[ -n "$etag" ]]; then
  code304="$(qa_http_code GET /api/phrase-game/bank -H "If-None-Match: $etag" -H 'Accept-Encoding: gzip' || true)"
  qa_expect_code "GET /api/phrase-game/bank If-None-Match" 304 "$code304"
else
  qa_fail "phrase bank missing ETag"
fi

session="$(qa_tmp)"
code="$(qa_fetch /api/auth/session "$session" || true)"
if [[ "$code" == "200" ]]; then
  body="$(tr -d '[:space:]' < "$session")"
  if [[ "$body" == "{}" || "$body" == "null" ]]; then
    qa_pass "GET /api/auth/session empty guest ($body)"
  else
    qa_pass "GET /api/auth/session 200 ($body)"
  fi
else
  qa_fail "GET /api/auth/session ($code)"
fi
rm -f "$session"

qa_expect_code "GET /api/game/progress (guest)" 401 "$(qa_http_code GET /api/game/progress || true)"
qa_expect_code "POST /api/game/round (guest)" 401 "$(qa_http_code POST /api/game/round -H 'Content-Type: application/json' -d '{}' || true)"
qa_expect_code "POST /api/chat (guest)" 401 "$(qa_http_code POST /api/chat -H 'Content-Type: application/json' -d '{}' || true)"
qa_expect_code_re "GET /api/lessons (guest)" '401|403' "$(qa_http_code GET /api/lessons || true)"
qa_expect_code_re "GET /api/app/content/manifest (no bearer)" '401|503' "$(qa_http_code GET /api/app/content/manifest || true)"

if qa_is_prod_target; then
  qa_skip "POST /api/game/events empty body (not sent to production)"
else
  code="$(qa_http_code POST /api/game/events -H 'Content-Type: application/json' -d '' || true)"
  qa_expect_code_re "POST /api/game/events empty body" '400|415' "$code"
fi

qa_finish
