#!/usr/bin/env bash
# post-edit-test.sh — PostToolUse: run npm test after editing shadow-demo lib/ or test/
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" \
  2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then exit 0; fi

# Only shadow demo source
if [[ "$FILE_PATH" != *"shadow-corpus/archive/demo-v0.2/lib/"* ]] && \
   [[ "$FILE_PATH" != *"shadow-corpus/archive/demo-v0.2/test/"* ]] && \
   [[ "$FILE_PATH" != *"example/shadow-demo/lib/"* ]] && \
   [[ "$FILE_PATH" != *"example/shadow-demo/test/"* ]]; then
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DEMO="shadow-corpus/archive/demo-v0.2"
if [[ ! -f "$DEMO/package.json" ]] && [[ -f "example/shadow-demo/package.json" ]]; then
  DEMO="example/shadow-demo"
fi
if [[ ! -f "$DEMO/package.json" ]]; then exit 0; fi

echo "Running npm test after edit to $FILE_PATH ..."
if ! npm test --prefix "$DEMO" 2>&1; then
  echo ""
  echo "TEST FAILED: Fix errors above before continuing."
  echo "See 04-dev-testing/02-unit-testing.md and 07-debug-and-correction/03-test-failure-workflow.md"
  exit 1
fi

exit 0
