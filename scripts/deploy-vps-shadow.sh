#!/usr/bin/env bash
# Deploy Shadow demo (static docs + Node API) to shared VPS under /shadow/
# Usage: SERVER_IP=47.237.68.213 ./scripts/deploy-vps-shadow.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SERVER_IP="${SERVER_IP:?请设置 SERVER_IP}"
SSH_USER="${SSH_USER:-admin}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
APP_DIR="${APP_DIR:-/opt/shadow}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -i "$SSH_KEY")
ENV_LOCAL="${ENV_LOCAL:-shadow-corpus/archive/demo-v0.2/.env}"

echo "==> 构建 docs（board:publish）..."
npm run board:publish

echo "==> 目标: ${SSH_USER}@${SERVER_IP}:${APP_DIR}"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "未找到 SSH 密钥 $SSH_KEY" >&2
  exit 1
fi

if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "缺少 $ENV_LOCAL（需含 STEPFUN_API_KEY 等）" >&2
  exit 1
fi

TAR="/tmp/shadow-deploy-$(date +%s).tar.gz"
tar -czf "$TAR" \
  --exclude='node_modules' \
  --exclude='.git' \
  docs \
  shadow-corpus/archive/demo-v0.2 \
  deploy/vps

echo "==> 上传..."
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SERVER_IP}" "mkdir -p ${APP_DIR}"
scp "${SSH_OPTS[@]}" "$TAR" "${SSH_USER}@${SERVER_IP}:${APP_DIR}/release.tar.gz"
scp "${SSH_OPTS[@]}" "$ENV_LOCAL" "${SSH_USER}@${SERVER_IP}:${APP_DIR}/deploy/vps/.env"

echo "==> 远程构建并启动..."
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SERVER_IP}" bash -s <<REMOTE
set -euo pipefail
APP_DIR="${APP_DIR}"
cd "\$APP_DIR"
tar -xzf release.tar.gz
cd deploy/vps
docker compose build --no-cache
docker compose up -d
docker compose ps
REMOTE

rm -f "$TAR"

echo ""
echo "完成。若已同步 Nginx，打开:"
echo "  http://${SERVER_IP}/shadow/demo-hub.html"
echo "  http://${SERVER_IP}/shadow/generate.html"
echo "  http://${SERVER_IP}/shadow/api/health  (经 Nginx 转发)"
