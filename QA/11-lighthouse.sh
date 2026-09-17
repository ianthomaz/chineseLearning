#!/usr/bin/env bash
# Lighthouse mobile 390px. Skip if Chrome is missing. No PWA/offline requirement.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"
# shellcheck source=routes.sh
source "$QA_DIR/routes.sh"

qa_header "11 Lighthouse"

if [[ "$QA_SKIP_LIGHTHOUSE" == "1" ]]; then
  qa_skip "Lighthouse (--skip-lighthouse)"
  qa_finish
fi

if [[ ! -x "$QA_DIR/node_modules/.bin/lighthouse" ]]; then
  msg="Lighthouse not installed. cd QA && npm install"
  if [[ "$QA_FROM_RUN_ALL" == "1" ]]; then
    qa_skip "$msg"
    qa_finish
  fi
  qa_fail "$msg"
  qa_finish
fi

find_chrome() {
  local p
  for p in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome 2>/dev/null || true)" \
    "$(command -v google-chrome-stable 2>/dev/null || true)" \
    "$(command -v chromium 2>/dev/null || true)" \
    "$(command -v chromium-browser 2>/dev/null || true)"
  do
    if [[ -n "$p" && -x "$p" ]]; then
      printf '%s\n' "$p"
      return 0
    fi
  done
  if [[ -d "$QA_DIR/node_modules/playwright-core" || -d "$QA_DIR/node_modules/@playwright/test" ]]; then
    local pw
    pw="$(cd "$QA_DIR" && node -e "try{console.log(require('playwright-core').chromium.executablePath())}catch(e){process.exit(1)}" 2>/dev/null || true)"
    if [[ -n "$pw" && -x "$pw" ]]; then
      printf '%s\n' "$pw"
      return 0
    fi
  fi
  return 1
}

CHROME="$(find_chrome || true)"
if [[ -z "$CHROME" ]]; then
  qa_skip "no Chrome/Chromium found; install Chrome or: npx playwright install chromium"
  qa_finish
fi
qa_info "chrome=$CHROME"

qa_require_server

lh_dir="$REPORTS_DIR/lighthouse"
mkdir -p "$lh_dir"

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  slug="$(echo "$path" | sed 's#^/##;s#/#_#g')"
  [[ -z "$slug" ]] && slug="home"
  out="$lh_dir/${slug}.json"
  url="$(qa_url "$path")"
  qa_info "lighthouse $url"
  set +e
  "$QA_DIR/node_modules/.bin/lighthouse" "$url" \
    --quiet \
    --only-categories=performance,accessibility,best-practices,seo \
    --form-factor=mobile \
    --screenEmulation.mobile=true \
    --screenEmulation.width=390 \
    --screenEmulation.height=844 \
    --screenEmulation.deviceScaleFactor=2 \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --chrome-path="$CHROME" \
    --output=json \
    --output-path="$out"
  status=$?
  set -e
  if [[ "$status" -ne 0 || ! -f "$out" ]]; then
    qa_fail "lighthouse $path (exit $status)"
    continue
  fi
  scores="$(node -e '
    const r=require(process.argv[1]);
    const cats=r.categories||{};
    const fmt=(id)=> {
      const c=cats[id];
      if(!c||c.score==null) return id+"=?";
      return id+"="+Math.round(c.score*100);
    };
    console.log(["performance","accessibility","best-practices","seo"].map(fmt).join(" "));
  ' "$out")"
  qa_pass "lighthouse $path ($scores) → $out"
done < <(qa_lighthouse_pages)

qa_finish
