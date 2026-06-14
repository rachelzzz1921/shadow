#!/usr/bin/env bash
# pre-commit-test.sh — block git commit if npm test fails
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DEMO="shadow-corpus/archive/demo-v0.2"
if [[ ! -f "$DEMO/package.json" ]] && [[ -f "example/shadow-demo/package.json" ]]; then
  DEMO="example/shadow-demo"
fi
if [[ ! -f "$DEMO/package.json" ]]; then exit 0; fi

echo "pre-commit-test: running npm test ..."
if ! npm test --prefix "$DEMO" 2>&1; then
  echo "COMMIT BLOCKED: npm test failed."
  exit 1
fi

echo "pre-commit-test: passed."
exit 0
