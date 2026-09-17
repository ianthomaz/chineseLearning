#!/usr/bin/env bash
# Orchestrate live and/or local-build QA. Does not start the server or deploy.
set -euo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Usage: ./QA/run-all.sh [options]

Live (site already running):
  --target prod|local|dev|static   Default: prod
  --quick                          Scripts 01, 02, 06, 07, 08
  --only 01,05,10                  Subset by number
  --skip-browser
  --skip-lighthouse
  BASE_URL=https://…               Override default URL for the target

Local build (no server needed):
  --build                          Scripts 12–15
  --skip-llm                       Skip 15
  --require-llm                    Fail 15 if the LLM API is down

Both --build and --target can be used together.

Examples:
  ./QA/run-all.sh --target prod --quick
  ./QA/run-all.sh --build
  ./QA/run-all.sh --target local --build
  BASE_URL=http://127.0.0.1:34827 ./QA/run-all.sh --target dev --only 01,02
EOF
}

RUN_LIVE=0
RUN_BUILD=0
QUICK=0
ONLY=""
TARGET_SET=0
QA_TARGET="${QA_TARGET:-prod}"
QA_SKIP_LLM="${QA_SKIP_LLM:-0}"
QA_SKIP_BROWSER="${QA_SKIP_BROWSER:-0}"
QA_SKIP_LIGHTHOUSE="${QA_SKIP_LIGHTHOUSE:-0}"
QA_REQUIRE_LLM="${QA_REQUIRE_LLM:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      QA_TARGET="${2:-}"
      TARGET_SET=1
      RUN_LIVE=1
      shift 2
      ;;
    --build)
      RUN_BUILD=1
      shift
      ;;
    --quick)
      QUICK=1
      RUN_LIVE=1
      shift
      ;;
    --only)
      ONLY="${2:-}"
      RUN_LIVE=1
      shift 2
      ;;
    --skip-llm)
      QA_SKIP_LLM=1
      shift
      ;;
    --require-llm)
      QA_REQUIRE_LLM=1
      shift
      ;;
    --skip-browser)
      QA_SKIP_BROWSER=1
      shift
      ;;
    --skip-lighthouse)
      QA_SKIP_LIGHTHOUSE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$RUN_LIVE" -eq 0 && "$RUN_BUILD" -eq 0 ]]; then
  RUN_LIVE=1
  if [[ "$TARGET_SET" -eq 0 ]]; then
    QA_TARGET="prod"
  fi
fi

export QA_TARGET QA_SKIP_LLM QA_SKIP_BROWSER QA_SKIP_LIGHTHOUSE
export QA_REQUIRE_LLM QA_FROM_RUN_ALL=1

# shellcheck source=lib.sh
source "$QA_DIR/lib.sh"

script_path() {
  local n="$1"
  local matches=("$QA_DIR"/"$n"-*.sh)
  if [[ -f "${matches[0]:-}" ]]; then
    printf '%s\n' "${matches[0]}"
  else
    return 1
  fi
}

run_script() {
  local n="$1"
  local path
  if ! path="$(script_path "$n")"; then
    echo "No script numbered $n" >&2
    return 1
  fi
  echo ""
  echo "-------- $(basename "$path") --------"
  bash "$path"
}

OVERALL=0

if [[ "$RUN_LIVE" -eq 1 ]]; then
  local_nums=()
  if [[ -n "$ONLY" ]]; then
    IFS=',' read -r -a local_nums <<< "$ONLY"
  elif [[ "$QUICK" -eq 1 ]]; then
    local_nums=(01 02 06 07 08)
  else
    local_nums=(01 02 03 04 05 06 07 08 09 10 11)
  fi

  echo "QA live  target=$QA_TARGET  base=$BASE_URL"
  for n in "${local_nums[@]}"; do
    n="$(printf '%02d' "$((10#$n))" 2>/dev/null || echo "$n")"
    if [[ "$n" == "10" && "$QA_SKIP_BROWSER" == "1" ]]; then
      echo "SKIP  10-browser (--skip-browser)"
      continue
    fi
    if [[ "$n" == "11" && "$QA_SKIP_LIGHTHOUSE" == "1" ]]; then
      echo "SKIP  11-lighthouse (--skip-lighthouse)"
      continue
    fi
    if ! run_script "$n"; then
      OVERALL=1
    fi
  done
fi

if [[ "$RUN_BUILD" -eq 1 ]]; then
  echo "QA build  repo=$REPO_ROOT"
  for n in 12 13 14 15; do
    if [[ "$n" == "15" && "$QA_SKIP_LLM" == "1" ]]; then
      echo "SKIP  15-llm-health (--skip-llm)"
      continue
    fi
    if ! run_script "$n"; then
      OVERALL=1
    fi
  done
fi

echo ""
if [[ "$OVERALL" -ne 0 ]]; then
  echo "QA finished with failures."
  exit 1
fi
echo "QA finished: all selected scripts passed."
exit 0
