#!/usr/bin/env bash
# Wrap web/scripts/check-llm-health.sh. Soft-fail unless --require-llm.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "15 LLM health"

if [[ "$QA_SKIP_LLM" == "1" ]]; then
  qa_skip "LLM health (--skip-llm)"
  qa_finish
fi

check="$WEB_DIR/scripts/check-llm-health.sh"
if [[ ! -x "$check" && ! -f "$check" ]]; then
  qa_fail "missing $check"
  qa_finish
fi

set +e
bash "$check"
status=$?
set -e

if [[ "$status" -eq 0 ]]; then
  qa_pass "LLM /health"
elif [[ "$QA_REQUIRE_LLM" == "1" ]]; then
  qa_fail "LLM /health (exit $status)"
else
  qa_skip "LLM API not up (use --require-llm to fail)"
fi
qa_finish
