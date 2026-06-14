#!/usr/bin/env bash
# 从 shadow-corpus 主树重新打包 fate-world-kit
set -euo pipefail
PKG="$(cd "$(dirname "$0")" && pwd)"
CORPUS="$(cd "$PKG/.." && pwd)"
OUT="$PKG/fate-world-kit"
NB="$OUT/notebooklm"

# 保留 notebooklm prompt（若已存在）
TMP_NB=""
if [[ -d "$NB" ]]; then
  TMP_NB=$(mktemp -d)
  cp -R "$NB/"* "$TMP_NB/"
fi

rm -rf "$OUT"
mkdir -p "$OUT"/{docs,notebooklm,skill}

cp -R "$CORPUS/world" "$OUT/"
cp -R "$CORPUS/skills/shadow/fate-agent/"* "$OUT/skill/"
cp "$CORPUS/01-requirements/03-fate-agent-requirements.md" "$OUT/docs/"
cp "$CORPUS/02-technical-design/03-fate-agent-and-world-db.md" "$OUT/docs/"
cp "$CORPUS/02-technical-design/04-scenario-weight-system.md" "$OUT/docs/"

if [[ -n "$TMP_NB" ]]; then
  cp -R "$TMP_NB/"* "$OUT/notebooklm/"
  rm -rf "$TMP_NB"
elif [[ -d "$CORPUS/world/notebooklm" ]]; then
  cp -R "$CORPUS/world/notebooklm/"* "$OUT/notebooklm/"
fi

mkdir -p "$OUT/world/data/notebooklm-import"
touch "$OUT/world/data/notebooklm-import/.gitkeep"

cp "$OUT/README.md" "$OUT/README.md.bak" 2>/dev/null || true
# README 若被 rm 掉则从 corpus 模板恢复（首次 build 后 README 在 OUT 内维护）

echo "Packed → $OUT"
du -sh "$OUT"
