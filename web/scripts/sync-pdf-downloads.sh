#!/usr/bin/env bash
set -euo pipefail
# Copy large vocabulary PDFs from pdf-content/ → public/downloads/ before Next build.
# pdf-content/*.pdf is gitignored; deploy rsync uploads pdf-content/; remote prebuild runs this script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$WEB_DIR/pdf-content"
DST="$WEB_DIR/public/downloads"
mkdir -p "$DST" "$SRC"
shopt -s nullglob
files=("$SRC"/*.pdf)
if ((${#files[@]})); then
  cp -f "${files[@]}" "$DST/"
  echo "sync-pdf-downloads: copied ${#files[@]} PDF(s) → public/downloads/"
else
  echo "sync-pdf-downloads: no PDFs in pdf-content/ (skipping)."
fi
