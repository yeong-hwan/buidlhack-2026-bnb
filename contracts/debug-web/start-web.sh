#!/usr/bin/env bash
set -euo pipefail

DEBUG_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_PORT="${DEBUG_WEB_PORT:-3000}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found." >&2
  exit 1
fi

echo "[debug] starting web server at http://127.0.0.1:${WEB_PORT}"
echo "[debug] open /index.html and it will preload addresses from debug-web/demo-config.js"
cd "$DEBUG_DIR"
python3 -m http.server "$WEB_PORT"
