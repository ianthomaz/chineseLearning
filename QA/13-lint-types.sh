#!/usr/bin/env bash
# eslint + tsc in web/ (no server required).
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "13 lint + types"
cd "$WEB_DIR"

set +e
npx eslint src
es=$?
npx tsc --noEmit
ts=$?
set -e

if [[ "$es" -eq 0 ]]; then
  qa_pass "eslint src"
else
  qa_fail "eslint src (exit $es)"
fi
if [[ "$ts" -eq 0 ]]; then
  qa_pass "tsc --noEmit"
else
  qa_fail "tsc --noEmit (exit $ts)"
fi
qa_finish
