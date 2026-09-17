#!/usr/bin/env bash
# KTV JSON, sample PDFs (HEAD only), PWA manifest + sw.js presence.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "07 assets"
qa_require_server

catalog="$(qa_tmp)"
code="$(qa_fetch /ktv/catalog.json "$catalog" || true)"
if [[ "$code" != "200" ]]; then
  qa_fail "GET /ktv/catalog.json ($code)"
else
  qa_pass "GET /ktv/catalog.json"
  if grep -q '"songs"' "$catalog"; then
    qa_pass "catalog.json has songs"
  else
    qa_fail "catalog.json missing songs"
  fi
  # Extract "file": "letras/....json"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    song_code="$(qa_http_code GET "/ktv/$file" || true)"
    qa_expect_code "GET /ktv/$file" 200 "$song_code"
  done < <(grep -oE '"file"[[:space:]]*:[[:space:]]*"[^"]+"' "$catalog" | sed 's/.*"file"[[:space:]]*:[[:space:]]*"//;s/"$//')
fi
rm -f "$catalog"

qa_expect_code "GET /manifest.webmanifest" 200 "$(qa_http_code GET /manifest.webmanifest || true)"
sw_code="$(qa_http_code GET /sw.js || true)"
qa_expect_code_re "GET /sw.js (present; offline out of scope)" '200|304' "$sw_code"

# Visuals page → /downloads/*.pdf ; HEAD only (files can be tens of MB).
visuals="$(qa_tmp)"
qa_fetch /visuals "$visuals" >/dev/null || true
pdfs="$(grep -oE '/downloads/[^"?]+\.pdf' "$visuals" | sort -u || true)"
if [[ -z "$pdfs" ]]; then
  # Client-rendered catalog may omit hrefs; fall back to known sample.
  pdfs="/downloads/chineseVocabulary1.pdf"
  qa_info "no PDF hrefs in /visuals HTML; checking sample $pdfs"
fi
checked=0
while IFS= read -r pdf; do
  [[ -z "$pdf" ]] && continue
  checked=$((checked + 1))
  code="$(qa_http_code HEAD "$pdf" || true)"
  if [[ "$code" == "200" || "$code" == "405" ]]; then
    if [[ "$code" == "405" ]]; then
      hdr="$(qa_tmp)"
      gcode="$(qa_fetch_headers "$pdf" "$hdr" || true)"
      rm -f "$hdr"
      qa_expect_code "GET headers $pdf" 200 "$gcode"
    else
      qa_pass "HEAD $pdf ($code)"
    fi
  elif [[ "$code" == "404" ]] && ! qa_is_prod_target; then
    qa_skip "HEAD $pdf (404 — PDFs not synced on this local server)"
  else
    qa_fail "HEAD $pdf ($code)"
  fi
  # Cap: do not HEAD dozens of 50MB listings beyond a handful if many
  if [[ "$checked" -ge 12 ]]; then
    qa_info "stopped after 12 PDFs"
    break
  fi
done <<< "$pdfs"
rm -f "$visuals"

qa_finish
