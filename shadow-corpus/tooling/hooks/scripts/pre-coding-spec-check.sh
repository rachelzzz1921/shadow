#!/usr/bin/env bash
# pre-coding-spec-check.sh — WARNING when editing lib/ without CLAUDE.md context
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" \
  2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then exit 0; fi

if [[ "$FILE_PATH" != *"example/shadow-demo/lib/"* ]]; then
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [[ ! -f "$ROOT/CLAUDE.md" ]]; then
  echo "WARNING: CLAUDE.md missing. Run harness-init or read AGENTS.md before editing lib/."
  exit 1
fi

echo "Reminder: editing $FILE_PATH — ensure 03-coding/01-narrative-prompt-protocol.md is aligned."
exit 0
