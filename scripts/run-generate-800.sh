#!/usr/bin/env bash
# Bulk generate ~800 phrases (150+200+200+250). Runs until each level hits target.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/FRASES_GAME/generate.log"
mkdir -p "$ROOT/FRASES_GAME"
echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) start ===" | tee -a "$LOG"
node scripts/build-vocab-basico.mjs 2>&1 | tee -a "$LOG"
node scripts/generate-frases-game.mjs --all --batch-size 8 2>&1 | tee -a "$LOG"
echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) done ===" | tee -a "$LOG"
