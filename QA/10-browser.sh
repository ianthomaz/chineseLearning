#!/usr/bin/env bash
# Playwright against BASE_URL. Skips from run-all if not installed.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "10 browser (Playwright)"

if [[ "$QA_SKIP_BROWSER" == "1" ]]; then
  qa_skip "Playwright (--skip-browser)"
  qa_finish
fi

if [[ ! -d "$QA_DIR/node_modules/@playwright/test" ]]; then
  msg="Playwright not installed. cd QA && npm install && npx playwright install chromium"
  if [[ "$QA_FROM_RUN_ALL" == "1" && "$QA_REQUIRE_BROWSER" != "1" ]]; then
    qa_skip "$msg"
    qa_finish
  fi
  qa_fail "$msg"
  qa_finish
fi

qa_require_server
export BASE_URL
cd "$QA_DIR"
set +e
npx playwright test
status=$?
set -e
if [[ "$status" -eq 0 ]]; then
  qa_pass "Playwright (desktop 1280 + mobile 390)"
else
  qa_fail "Playwright exit $status (see QA/reports/playwright)"
fi
qa_finish
