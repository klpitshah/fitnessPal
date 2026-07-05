#!/usr/bin/env bash
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed."
  echo "Install with:  brew install cloudflared"
  echo "Or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build
PORT=3847 tsx server/index.ts &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

sleep 2
echo ""
echo "Opening HTTPS tunnel to http://127.0.0.1:3847 ..."
echo "Use the https://....trycloudflare.com URL on your phone (camera works, no cert install)."
echo ""

cloudflared tunnel --url "http://127.0.0.1:3847"
