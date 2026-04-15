# contracts/

Foundry project for the two core contracts of the platform:

- **`PerUserExecutor.sol`** — non-custodial executor owned by a single user. The backend operator can trigger swaps, but only through an allowlisted DEX router and token pair, bounded by a per-day spend cap. Funds live inside the contract; the user can revoke the operator or withdraw at any time.
- **`TradeReceiptRegistry.sol`** — global singleton that records every trade executed by an authorized `PerUserExecutor`. The onchain trail cannot be edited or hidden after the fact.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`, `cast`)
- Node 18+

## Setup

```bash
cd contracts
npm install          # installs tsx for export-abis script
npm run setup        # forge install: forge-std + openzeppelin-contracts
npm run build        # forge build
```

## Tests

```bash
npm test                                                          # unit tests (no fork)
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org npm run test:fork  # real PancakeSwap V3 swap
```

## Local dev

Start a local node (defaults to a BSC mainnet fork so real PancakeSwap pools work):

```bash
npm run anvil                              # fork BSC mainnet
FORK=testnet npm run anvil:testnet         # fork BSC testnet (thinner liquidity)
# OR plain: just run `anvil` without fork for clean state
```

Deploy the registry + a sample executor against the running local node:

```bash
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
PANCAKE_ROUTER=0x1b81D678ffb9C0263b24A97847620C99d213eB14 \
WBNB=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c \
USDT=0x55d398326f99059fF775485246999027B3197955 \
npm run deploy:local
```

This broadcasts **6 txs** (contract creations + allowlist setup).

## Export ABIs to frontend

```bash
npm run export-abis
```

Writes `PerUserExecutor.json`, `TradeReceiptRegistry.json`, and `addresses.json` to `../web/src/contracts/`.

## Deploy to BSC Testnet

```bash
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY with a funded account
source .env
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
PANCAKE_ROUTER=0x1b81D678ffb9C0263b24A97847620C99d213eB14 \
WBNB=0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd \
USDT=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd \
npm run deploy:testnet
```

## Addresses

See `addresses.json` for PancakeSwap V3 Factory / Router / Quoter / NonfungiblePositionManager addresses on BSC Testnet and Mainnet.
