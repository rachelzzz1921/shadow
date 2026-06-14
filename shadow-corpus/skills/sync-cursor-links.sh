#!/usr/bin/env bash
# sync-cursor-links.sh — Link shadow-corpus skills into .cursor/skills for Cursor discovery
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORPUS="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT="$(cd "$CORPUS/.." && pwd)"
DISCOVERY="$ROOT/.cursor/skills"

mkdir -p "$DISCOVERY"

# Rebuild discovery symlinks (remove stale links only)
for link in "$DISCOVERY"/*; do
  [[ -L "$link" ]] && rm -f "$link"
done

link_one() {
  local src="$1"
  local name="$2"
  ln -sfn "$src" "$DISCOVERY/$name"
}

# Third-party pool
for d in "$SCRIPT_DIR/pool"/*/; do
  [[ -d "$d" ]] || continue
  link_one "$(cd "$d" && pwd)" "$(basename "$d")"
done

# Shadow domain
for d in "$SCRIPT_DIR/shadow"/*/; do
  [[ -d "$d" ]] || continue
  link_one "$(cd "$d" && pwd)" "$(basename "$d")"
done

# Harness framework
for d in "$SCRIPT_DIR/harness"/*/; do
  [[ -d "$d" ]] || continue
  link_one "$(cd "$d" && pwd)" "$(basename "$d")"
done

# Router
link_one "$SCRIPT_DIR/shadow-router" "shadow-router"

COUNT=$(find "$DISCOVERY" -maxdepth 1 -type l | wc -l | tr -d ' ')
echo "Linked $COUNT skills → $DISCOVERY"
