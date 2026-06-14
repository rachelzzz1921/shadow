#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
echo ""
echo "  Shadow Demo — 启动本地服务 (port 3000)"
echo "  保持此窗口打开；关闭 = 页面无法访问"
echo ""
echo "  入口: http://localhost:3000/demo-hub.html"
echo "  Intake: http://localhost:3000/intake.html"
echo ""
exec npm run demo:local
