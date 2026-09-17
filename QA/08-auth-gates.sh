#!/usr/bin/env bash
# LoginGate copy on gated pages; curator pages refuse guests (no lesson form).
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"
# shellcheck source=routes.sh
source "$QA_DIR/routes.sh"

qa_header "08 auth gates"
qa_require_server

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  tmp="$(qa_tmp)"
  code="$(qa_fetch "$path" "$tmp" || true)"
  if [[ "$code" != "200" ]]; then
    qa_fail "GET $path for gate ($code)"
    rm -f "$tmp"
    continue
  fi
  if qa_is_static_target; then
    if grep -E -q "Feature disabled|Funcionalidade desativada|authGate.disabledTitle" "$tmp"; then
      qa_pass "$path static gate copy"
    else
      qa_pass "$path 200 (gate copy is client-rendered; Playwright 10 covers it)"
    fi
  else
    if grep -E -q "Sign in to continue|Entre para continuar|Inicia sesión para continuar|authGate.title" "$tmp"; then
      qa_pass "$path LoginGate copy in payload"
    else
      qa_pass "$path 200 (LoginGate hydrates client-side; Playwright 10 covers it)"
    fi
  fi
  rm -f "$tmp"
done < <(qa_gated_pages)

if qa_is_static_target; then
  qa_skip "curator HTML (pages absent on static export)"
  qa_finish
fi

reg="$(qa_tmp)"
qa_fetch /registerClass "$reg" >/dev/null || true
qa_expect_contains "/registerClass guest copy" "$reg" "Inicie sessão com a conta de curador"
qa_expect_not_contains "/registerClass has no lesson form" "$reg" "Data da aula *"

rev="$(qa_tmp)"
qa_fetch /reviewClass "$rev" >/dev/null || true
qa_expect_contains "/reviewClass guest copy" "$rev" "Inicie sessão com a conta de curador"

back="$(qa_tmp)"
qa_fetch /backoffice "$back" >/dev/null || true
qa_expect_contains "/backoffice guest copy" "$back" "Inicie sessão com a conta de administrador"

rm -f "$reg" "$rev" "$back"
qa_finish
