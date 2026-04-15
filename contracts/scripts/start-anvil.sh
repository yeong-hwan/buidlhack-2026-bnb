#!/usr/bin/env bash
set -euo pipefail

# Start a local Anvil node forking BSC Mainnet so we get real PancakeSwap V3
# pools + liquidity locally. Defaults to mainnet; override with FORK=testnet
# to use BSC Testnet (thinner liquidity).

FORK="${FORK:-mainnet}"

case "$FORK" in
  mainnet)
    RPC="${BSC_MAINNET_RPC:-https://bsc-dataseed.binance.org}"
    CHAIN_ID=56
    ;;
  testnet)
    RPC="${BSC_TESTNET_RPC:-https://data-seed-prebsc-1-s1.bnbchain.org:8545}"
    CHAIN_ID=97
    ;;
  *)
    echo "Unknown FORK: $FORK (use mainnet|testnet)" >&2
    exit 1
    ;;
esac

echo "[anvil] Forking BSC $FORK from $RPC (chain-id $CHAIN_ID)"

exec anvil \
  --fork-url "$RPC" \
  --chain-id "$CHAIN_ID" \
  --host 127.0.0.1 \
  --port 8545 \
  --block-time 2
