#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEBUG_DIR="$(cd "$(dirname "$0")" && pwd)"

ANVIL_PORT="${DEBUG_ANVIL_PORT:-8545}"
ANVIL_RPC="http://127.0.0.1:${ANVIL_PORT}"

DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
USE_LOCAL_MOCKS="${USE_LOCAL_MOCKS:-true}"
DEMO_PAIR_RATE="${DEMO_PAIR_RATE:-1000000000000000000}"
DEMO_EPOCH_CAP="${DEMO_EPOCH_CAP:-1000}"

PANCAKE_ROUTER="${PANCAKE_ROUTER:-0x0000000000000000000000000000000000000000}"
WBNB="${WBNB:-0x0000000000000000000000000000000000000000}"
USDT="${USDT:-0x0000000000000000000000000000000000000000}"
SAMPLE_STRATEGY_ID="${SAMPLE_STRATEGY_ID:-$(cast keccak "demo-strategy")}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$1 not found." >&2
    exit 1
  fi
}

require_cmd cast
require_cmd forge

if ! cast chain-id --rpc-url "$ANVIL_RPC" >/dev/null 2>&1; then
  echo "[debug] anvil is not reachable at ${ANVIL_RPC}. run debug-web/run-fresh-chain.sh first." >&2
  exit 1
fi

DEPLOYER_ADDR="$(cast wallet address --private-key "${DEPLOYER_PRIVATE_KEY}")"
SAMPLE_USER="${SAMPLE_USER:-${DEPLOYER_ADDR}}"
SAMPLE_OPERATOR="${SAMPLE_OPERATOR:-${SAMPLE_USER}}"

DEPLOY_OUT="$(mktemp)"
(
  cd "$ROOT_DIR"
  echo "[debug] deploying demo contracts..."
  DEPLOYER_PRIVATE_KEY="$DEPLOYER_PRIVATE_KEY" \
  SAMPLE_STRATEGY_ID="$SAMPLE_STRATEGY_ID" \
  SAMPLE_USER="$SAMPLE_USER" \
  SAMPLE_OPERATOR="$SAMPLE_OPERATOR" \
  USE_LOCAL_MOCKS="$USE_LOCAL_MOCKS" \
  DEMO_PAIR_RATE="$DEMO_PAIR_RATE" \
  DEMO_EPOCH_CAP="$DEMO_EPOCH_CAP" \
  PANCAKE_ROUTER="$PANCAKE_ROUTER" \
  WBNB="$WBNB" \
  USDT="$USDT" \
  forge script script/Deploy.s.sol \
    --rpc-url "$ANVIL_RPC" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --sender "$DEPLOYER_ADDR" \
    --broadcast -vv
) | tee "$DEPLOY_OUT"

REGISTRY_ADDR="$(grep -m1 "TradeReceiptRegistry:" "$DEPLOY_OUT" | awk '{print $2}' | tr -d '\r')"
EXECUTOR_ADDR="$(grep -m1 "PerUserExecutor:" "$DEPLOY_OUT" | awk '{print $2}' | tr -d '\r')"
ROUTER_ADDR="$(grep -m1 "MockPancakeV3Router:\|PancakeRouter:" "$DEPLOY_OUT" | awk '{print $2}' | tr -d '\r')"
WBNB_ADDR="$(grep -m1 "MockERC20_WBNB:\|WBNB:" "$DEPLOY_OUT" | awk '{print $2}' | tr -d '\r')"
USDT_ADDR="$(grep -m1 "MockERC20_USDT:\|USDT:" "$DEPLOY_OUT" | awk '{print $2}' | tr -d '\r')"

if [ -z "${REGISTRY_ADDR:-}" ] || [ -z "${EXECUTOR_ADDR:-}" ]; then
  echo "[debug] failed to parse deployed addresses from forge output." >&2
  tail -n 80 "$DEPLOY_OUT" >&2
  exit 1
fi

cat > "$DEBUG_DIR/demo-config.js" <<EOT
window.DEMO_CONFIG = {
  sampleUser: "$SAMPLE_USER",
  sampleOperator: "$SAMPLE_OPERATOR",
  registry: "$REGISTRY_ADDR",
  executor: "$EXECUTOR_ADDR",
  strategyId: "$SAMPLE_STRATEGY_ID",
  swapRouter: "$ROUTER_ADDR",
  mockWbnb: "$WBNB_ADDR",
  mockUsdt: "$USDT_ADDR",
  useLocalMocks: $USE_LOCAL_MOCKS,
  anvilRpc: "$ANVIL_RPC"
};
EOT

echo ""
echo "[debug] contracts initialized"
echo "TRADE_RECEIPT_REGISTRY=$REGISTRY_ADDR"
echo "PER_USER_EXECUTOR=$EXECUTOR_ADDR"
echo "SWAP_ROUTER=$ROUTER_ADDR"
echo "INFO: saved to $DEBUG_DIR/demo-config.js"
