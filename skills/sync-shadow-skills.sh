#!/usr/bin/env bash
# 将 skills/shadow 与 skills/harness 的 canonical 副本同步到 .agents/skills 软链。
# npx skills update 不会覆盖软链指向的 shadow/harness 目录。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_SKILLS="$ROOT/.agents/skills"

link_skill() {
  local name="$1"
  local target="$2"
  rm -rf "$AGENTS_SKILLS/$name"
  ln -sf "$target" "$AGENTS_SKILLS/$name"
  echo "linked $name -> $target"
}

cd "$ROOT"

link_skill story-authoring "../../skills/shadow/story-authoring"
link_skill story-review "../../skills/shadow/story-review"
link_skill harness-init "../../skills/shadow/harness-init"
link_skill design-generator "../../skills/harness/design-generator"
link_skill progress-tracker "../../skills/harness/progress-tracker"

# Cursor 发现路径
mkdir -p "$ROOT/.cursor"
ln -sfn ../.agents/skills "$ROOT/.cursor/skills"

echo "Done. Shadow/harness skills synced. Run: npx skills list | grep -E 'story|harness|design|progress'"
