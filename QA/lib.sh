#!/usr/bin/env bash
# Shared helpers for QA scripts. Source this file; do not execute it.

if [[ -n "${_QA_LIB_LOADED:-}" ]]; then
  return 0
fi
_QA_LIB_LOADED=1

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$QA_DIR/.." && pwd)"
WEB_DIR="$REPO_ROOT/web"
REPORTS_DIR="${QA_REPORTS_DIR:-$QA_DIR/reports}"

QA_TARGET="${QA_TARGET:-prod}"
QA_SKIP_LLM="${QA_SKIP_LLM:-0}"
QA_SKIP_BROWSER="${QA_SKIP_BROWSER:-0}"
QA_SKIP_LIGHTHOUSE="${QA_SKIP_LIGHTHOUSE:-0}"
QA_FROM_RUN_ALL="${QA_FROM_RUN_ALL:-0}"
QA_REQUIRE_LLM="${QA_REQUIRE_LLM:-0}"
QA_REQUIRE_BROWSER="${QA_REQUIRE_BROWSER:-0}"

QA_PASS_COUNT=0
QA_FAIL_COUNT=0
QA_SKIP_COUNT=0

mkdir -p "$REPORTS_DIR"

if [[ -t 1 ]]; then
  _QA_GREEN=$'\033[32m'
  _QA_RED=$'\033[31m'
  _QA_YELLOW=$'\033[33m'
  _QA_DIM=$'\033[2m'
  _QA_RESET=$'\033[0m'
else
  _QA_GREEN=''
  _QA_RED=''
  _QA_YELLOW=''
  _QA_DIM=''
  _QA_RESET=''
fi

qa_default_base_url() {
  case "${1:-prod}" in
    prod) echo "https://learnchinese.today" ;;
    local) echo "http://127.0.0.1:34902" ;;
    dev) echo "http://127.0.0.1:34827" ;;
    static) echo "http://127.0.0.1:34901" ;;
    *) echo "https://learnchinese.today" ;;
  esac
}

if [[ -z "${BASE_URL:-}" ]]; then
  BASE_URL="$(qa_default_base_url "$QA_TARGET")"
fi
BASE_URL="${BASE_URL%/}"

qa_is_https() {
  [[ "$BASE_URL" == https://* ]]
}

qa_is_local() {
  [[ "$BASE_URL" == http://127.0.0.1:* || "$BASE_URL" == http://localhost:* ]]
}

qa_is_server_target() {
  case "$QA_TARGET" in
    prod|local|dev) return 0 ;;
    *) return 1 ;;
  esac
}

qa_is_static_target() {
  [[ "$QA_TARGET" == "static" ]]
}

qa_is_prod_target() {
  [[ "$QA_TARGET" == "prod" ]]
}

qa_info() {
  printf '%sINFO%s  %s\n' "$_QA_DIM" "$_QA_RESET" "$*"
}

qa_pass() {
  QA_PASS_COUNT=$((QA_PASS_COUNT + 1))
  printf '%sPASS%s  %s\n' "$_QA_GREEN" "$_QA_RESET" "$*"
}

qa_fail() {
  QA_FAIL_COUNT=$((QA_FAIL_COUNT + 1))
  printf '%sFAIL%s  %s\n' "$_QA_RED" "$_QA_RESET" "$*"
}

qa_skip() {
  QA_SKIP_COUNT=$((QA_SKIP_COUNT + 1))
  printf '%sSKIP%s  %s\n' "$_QA_YELLOW" "$_QA_RESET" "$*"
}

qa_header() {
  printf '\n%s== %s ==%s\n' "$_QA_DIM" "$*" "$_QA_RESET"
}

qa_url() {
  local path="$1"
  if [[ "$path" == http://* || "$path" == https://* ]]; then
    printf '%s\n' "$path"
    return
  fi
  if [[ "$path" != /* ]]; then
    path="/$path"
  fi
  printf '%s%s\n' "$BASE_URL" "$path"
}

# GET/HEAD/POST. Prints: HTTP_CODE<TAB>FINAL_URL
# Extra curl args after the URL.
qa_curl() {
  local method="$1"
  local url="$2"
  shift 2
  local follow=()
  if [[ "${QA_CURL_NO_FOLLOW:-0}" != "1" ]]; then
    follow=(-L)
  fi
  curl -sS "${follow[@]}" --max-time "${QA_TIMEOUT:-30}" \
    -A "learnchinese-qa/1.0" \
    -X "$method" \
    -o /dev/null \
    -w '%{http_code}\t%{url_effective}' \
    "$@" \
    "$url"
}

qa_http_code() {
  local method="$1"
  local path_or_url="$2"
  shift 2
  local url
  url="$(qa_url "$path_or_url")"
  local out
  out="$(qa_curl "$method" "$url" "$@" 2>/dev/null || true)"
  printf '%s\n' "${out%%$'\t'*}"
}

# Download body to a file. Prints HTTP code. Uses -L unless QA_CURL_NO_FOLLOW=1.
qa_fetch() {
  local path_or_url="$1"
  local outfile="$2"
  shift 2
  local url follow=()
  url="$(qa_url "$path_or_url")"
  if [[ "${QA_CURL_NO_FOLLOW:-0}" != "1" ]]; then
    follow=(-L)
  fi
  curl -sS "${follow[@]}" --max-time "${QA_TIMEOUT:-45}" \
    -A "learnchinese-qa/1.0" \
    -o "$outfile" \
    -w '%{http_code}' \
    "$@" \
    "$url"
}

qa_fetch_headers() {
  local path_or_url="$1"
  local outfile="$2"
  shift 2
  local url follow=()
  url="$(qa_url "$path_or_url")"
  if [[ "${QA_CURL_NO_FOLLOW:-0}" != "1" ]]; then
    follow=(-L)
  fi
  curl -sS "${follow[@]}" --max-time "${QA_TIMEOUT:-30}" \
    -A "learnchinese-qa/1.0" \
    -D "$outfile" \
    -o /dev/null \
    -w '%{http_code}' \
    "$@" \
    "$url"
}

# Uncompressed HTML byte size (curl decompresses gzip).
qa_body_size() {
  local path_or_url="$1"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(qa_fetch "$path_or_url" "$tmp" --compressed || true)"
  local size
  size="$(wc -c < "$tmp" | tr -d ' ')"
  rm -f "$tmp"
  printf '%s %s\n' "$code" "$size"
}

qa_gzip_size() {
  local path_or_url="$1"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(qa_fetch "$path_or_url" "$tmp" -H 'Accept-Encoding: gzip' || true)"
  local size
  size="$(wc -c < "$tmp" | tr -d ' ')"
  rm -f "$tmp"
  printf '%s %s\n' "$code" "$size"
}

qa_expect_code() {
  local name="$1"
  local expected="$2"
  local got="$3"
  local extra="${4:-}"
  if [[ "$got" == "$expected" ]]; then
    qa_pass "$name ($got)"
  else
    qa_fail "$name (expected $expected, got ${got:-empty}${extra:+; $extra})"
  fi
}

# expected is a regex, e.g. '401|403'
qa_expect_code_re() {
  local name="$1"
  local expected_re="$2"
  local got="$3"
  if [[ "$got" =~ $expected_re ]]; then
    qa_pass "$name ($got)"
  else
    qa_fail "$name (expected /$expected_re/, got ${got:-empty})"
  fi
}

qa_expect_contains() {
  local name="$1"
  local file="$2"
  local needle="$3"
  if grep -F -q -- "$needle" "$file" 2>/dev/null; then
    qa_pass "$name"
  else
    qa_fail "$name (missing: $needle)"
  fi
}

qa_expect_not_contains() {
  local name="$1"
  local file="$2"
  local needle="$3"
  if grep -F -q -- "$needle" "$file" 2>/dev/null; then
    qa_fail "$name (unexpected: $needle)"
  else
    qa_pass "$name"
  fi
}

qa_require_server() {
  local code
  code="$(qa_http_code GET / || true)"
  if [[ -z "$code" || "$code" == "000" ]]; then
    qa_fail "server not reachable at $BASE_URL"
    qa_info "Start the site first (./start.sh, ./start.sh --local, or prod)."
    qa_finish
  fi
  qa_info "target=$QA_TARGET  base=$BASE_URL  home=$code"
}

qa_tmp() {
  mktemp "${TMPDIR:-/tmp}/qa.XXXXXX"
}

qa_finish() {
  printf '\n%s%d passed, %d failed, %d skipped%s\n' \
    "$_QA_DIM" "$QA_PASS_COUNT" "$QA_FAIL_COUNT" "$QA_SKIP_COUNT" "$_QA_RESET"
  if [[ "$QA_FAIL_COUNT" -gt 0 ]]; then
    exit 1
  fi
  exit 0
}
