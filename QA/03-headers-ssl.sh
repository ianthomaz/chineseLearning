#!/usr/bin/env bash
# TLS, http→https, Content-Type, PDF Content-Disposition: inline.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "03 headers / SSL"
qa_require_server

if qa_is_https; then
  host="${BASE_URL#https://}"
  host="${host%%/*}"
  if command -v openssl >/dev/null 2>&1; then
    if echo | openssl s_client -servername "$host" -connect "${host}:443" >/dev/null 2>&1; then
      qa_pass "TLS handshake $host:443"
    else
      qa_fail "TLS handshake $host:443"
    fi
  else
    qa_skip "openssl not installed; curl HTTPS already used for home"
  fi

  http_url="http://${host}/"
  QA_CURL_NO_FOLLOW=1
  hdr="$(qa_tmp)"
  code="$(qa_fetch_headers "$http_url" "$hdr" || true)"
  unset QA_CURL_NO_FOLLOW
  loc="$(grep -i '^location:' "$hdr" | head -1 | tr -d '\r')"
  if [[ "$code" =~ ^30[1278]$ ]] && grep -qi 'https://' <<<"$loc"; then
    qa_pass "http→https redirect ($code $loc)"
  elif [[ "$code" == "200" ]]; then
    qa_fail "http://$host served 200 without HTTPS redirect"
  else
    qa_fail "http→https ($code ${loc:-no location})"
  fi
  rm -f "$hdr"
else
  qa_skip "SSL checks (BASE_URL is not HTTPS)"
fi

html_hdr="$(qa_tmp)"
code="$(qa_fetch_headers / "$html_hdr" || true)"
ctype="$(grep -i '^content-type:' "$html_hdr" | head -1 | tr -d '\r')"
if [[ "$code" == "200" ]] && grep -qi 'text/html' <<<"$ctype"; then
  qa_pass "GET / Content-Type: text/html"
else
  qa_fail "GET / Content-Type ($code $ctype)"
fi
rm -f "$html_hdr"

pdf_path="/downloads/chineseVocabulary1.pdf"
pdf_hdr="$(qa_tmp)"
pdf_url="$(qa_url "$pdf_path")"
code="$(curl -sS -I --max-time 30 -A "learnchinese-qa/1.0" -D "$pdf_hdr" -o /dev/null -w '%{http_code}' "$pdf_url" || true)"
if [[ "$code" == "405" || "$code" == "403" ]]; then
  code="$(qa_fetch_headers "$pdf_path" "$pdf_hdr" || true)"
fi
disp="$(grep -i '^content-disposition:' "$pdf_hdr" | head -1 | tr -d '\r' || true)"
if [[ "$code" == "200" ]]; then
  if grep -qi 'inline' <<<"$disp"; then
    qa_pass "PDF Content-Disposition: inline"
  elif [[ -z "$disp" ]]; then
    qa_fail "PDF $pdf_path missing Content-Disposition: inline"
  else
    qa_fail "PDF Content-Disposition not inline ($disp)"
  fi
elif [[ "$code" == "404" ]] && ! qa_is_prod_target; then
  qa_skip "PDF $pdf_path not on this server (pdf-content is gitignored; local often has no copies)"
else
  qa_fail "HEAD/GET $pdf_path ($code)"
fi
rm -f "$pdf_hdr"

qa_finish
