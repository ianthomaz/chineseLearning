#!/usr/bin/env bash
# Same i18n key trees in en.json, pt.json, es.json.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

qa_header "12 i18n keys"

MSG_DIR="$WEB_DIR/src/messages"
export MSG_DIR

set +e
out="$(node <<'NODE'
const fs = require("fs");
const path = require("path");
const dir = process.env.MSG_DIR;

function flatten(obj, prefix, acc) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    acc.push(prefix);
    return acc;
  }
  const keys = Object.keys(obj).sort();
  if (keys.length === 0) {
    acc.push(prefix || "(empty object)");
    return acc;
  }
  for (const k of keys) {
    flatten(obj[k], prefix ? prefix + "." + k : k, acc);
  }
  return acc;
}

const locales = ["en", "pt", "es"];
const maps = {};
for (const loc of locales) {
  const file = path.join(dir, loc + ".json");
  if (!fs.existsSync(file)) {
    console.log("MISSING_FILE " + file);
    process.exit(2);
  }
  maps[loc] = new Set(flatten(JSON.parse(fs.readFileSync(file, "utf8")), "", []));
}
const all = new Set();
for (const loc of locales) for (const k of maps[loc]) all.add(k);
let missing = 0;
for (const k of [...all].sort()) {
  const absent = locales.filter((loc) => !maps[loc].has(k));
  if (absent.length) {
    console.log("MISSING " + k + " in " + absent.join(","));
    missing += 1;
  }
}
if (missing === 0) {
  console.log("OK " + all.size + " keys in en/pt/es");
  process.exit(0);
}
process.exit(1);
NODE
)"
status=$?
set -e
printf '%s\n' "$out"

if [[ "$status" -eq 0 ]]; then
  qa_pass "en/pt/es key parity"
else
  qa_fail "en/pt/es key mismatch"
fi
qa_finish
