#!/usr/bin/env bash
set -euo pipefail

ANVIL_PORT="${DEBUG_ANVIL_PORT:-8545}"
ANVIL_RPC="http://127.0.0.1:${ANVIL_PORT}"

if ! command -v anvil >/dev/null 2>&1; then
  echo "anvil not found." >&2
  exit 1
fi

EXISTING_PID=""
if command -v lsof >/dev/null 2>&1; then
  EXISTING_PID="$(lsof -iTCP:"${ANVIL_PORT}" -sTCP:LISTEN -nP -t | head -n 1 || true)"
fi

if [ -n "${EXISTING_PID}" ]; then
  echo "[debug] stopping existing process on ${ANVIL_RPC} (pid=${EXISTING_PID})"
  kill "${EXISTING_PID}" >/dev/null 2>&1 || true
  sleep 1
fi

echo "[debug] starting fresh local anvil on ${ANVIL_RPC} (chainId=31337)"
echo "[debug] this process stays in foreground. stop it with Ctrl+C"

anvil --chain-id 31337 \
  --host 127.0.0.1 \
  --port "${ANVIL_PORT}" \
  --accounts 10 \
  --balance 10000 \
  --gas-limit 12000000
