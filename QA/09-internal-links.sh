#!/usr/bin/env bash
# Follow internal hrefs from seed pages. One hop, no external hosts.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"
# shellcheck source=routes.sh
source "$QA_DIR/routes.sh"

qa_header "09 internal links"
qa_require_server

host="${BASE_URL#http://}"
host="${host#https://}"
host="${host%%/*}"

extract_hrefs() {
  local html="$1"
  grep -oE 'href="[^"]+"' "$html" 2>/dev/null | sed 's/^href="//;s/"$//' || true
  grep -oE "href='[^']+'" "$html" 2>/dev/null | sed "s/^href='//;s/'$//" || true
}

normalize_path() {
  local href="$1"
  case "$href" in
    ''|'#'*|javascript:*|mailto:*|tel:*|data:*) return 1 ;;
    http://*|https://*)
      local h="${href#http://}"
      h="${h#https://}"
      local href_host="${h%%/*}"
      if [[ "$href_host" != "$host" && "$href_host" != "www.$host" ]]; then
        return 1
      fi
      local rest="/${h#*/}"
      if [[ "$h" == "$href_host" ]]; then
        rest="/"
      fi
      printf '%s\n' "${rest%%\?*}"
      ;;
    /*)
      printf '%s\n' "${href%%\?*}"
      ;;
    *)
      return 1
      ;;
  esac
}

declare -a QUEUE=()
while IFS= read -r seed; do
  [[ -n "$seed" ]] && QUEUE+=("$seed")
done < <(qa_crawl_seeds)

seen_file="$(qa_tmp)"
: > "$seen_file"
hrefs_file="$(qa_tmp)"
: > "$hrefs_file"

for seed in "${QUEUE[@]}"; do
  tmp="$(qa_tmp)"
  code="$(qa_fetch "$seed" "$tmp" || true)"
  if [[ "$code" != "200" ]]; then
    qa_fail "seed $seed ($code)"
    rm -f "$tmp"
    continue
  fi
  while IFS= read -r href; do
    path="$(normalize_path "$href" || true)"
    [[ -z "$path" ]] && continue
    path="${path%/}"
    [[ -z "$path" ]] && path="/"
    if grep -Fxq "$path" "$seen_file"; then
      continue
    fi
    echo "$path" >> "$seen_file"
    echo "$path" >> "$hrefs_file"
  done < <(extract_hrefs "$tmp")
  rm -f "$tmp"
done

count=0
fail_n=0
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  count=$((count + 1))
  code="$(qa_http_code GET "$path" || true)"
  if [[ "$code" =~ ^2 ]]; then
    qa_pass "link $path ($code)"
  elif [[ "$code" =~ ^3 ]]; then
    qa_pass "link $path redirect ($code)"
  else
    qa_fail "link $path ($code)"
    fail_n=$((fail_n + 1))
  fi
done < "$hrefs_file"

qa_info "internal hrefs checked: $count"
rm -f "$seen_file" "$hrefs_file"
qa_finish
