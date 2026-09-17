#!/usr/bin/env bash
# Dual Next build (server + static export) and HTML/RSC payload listing.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "14 dual build"
cd "$WEB_DIR"

set +e
npm run build
server=$?
set -e
if [[ "$server" -eq 0 ]]; then
  qa_pass "npm run build (server)"
else
  qa_fail "npm run build (exit $server)"
fi

if [[ "$server" -eq 0 && -d .next/server/app ]]; then
  list="$(qa_tmp)"
  node <<'NODE' > "$list"
const fs = require("fs");
const path = require("path");
const root = path.join(".next", "server", "app");
const rows = [];
function walk(d, depth) {
  if (depth > 6 || !fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/\.(html|rsc)$/.test(e.name)) rows.push([fs.statSync(p).size, p]);
  }
}
walk(root, 0);
rows.sort((a, b) => b[0] - a[0]);
for (const [size, p] of rows.slice(0, 20)) {
  console.log(String(size).padStart(10) + "  " + p);
}
NODE
  qa_info "largest HTML/RSC (top 20):"
  cat "$list"
  cp "$list" "$REPORTS_DIR/next-payloads.txt"
  rm -f "$list"
  qa_pass "payload listing → $REPORTS_DIR/next-payloads.txt"
fi

set +e
npm run build:webplace
static=$?
set -e
if [[ "$static" -eq 0 ]]; then
  qa_pass "npm run build:webplace (static export)"
else
  qa_fail "npm run build:webplace (exit $static)"
fi

qa_finish
