#!/usr/bin/env bash
# post-progress-update.sh — hint progress.md update when key harness docs are written
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" \
  2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then exit 0; fi

case "$FILE_PATH" in
  *01-requirements/*)
    echo "Progress hint: stage → requirements. Update progress.md if tracking a change."
    ;;
  *02-technical-design/*)
    echo "Progress hint: stage → design."
    ;;
  *03-coding/*|*example/shadow-demo/lib/prompts.js)
    echo "Progress hint: stage → coding. Log prompt changes in 06-task-progress/02-prompt-experiments-log.md"
    ;;
  *04-dev-testing/*)
    echo "Progress hint: stage → dev-test."
    ;;
  *05-qa-testing/*)
    echo "Progress hint: stage → qa."
    ;;
esac

exit 0
