# AgentBlock

No-code on-chain trading agent platform on BNB Chain.

Design trading strategies by composing visual blocks, then deploy autonomous multi-agent systems that execute on BSC and opBNB.

## Architecture

```
Frontend (Next.js + React Flow)
  Strategy Studio — DAG canvas with 5 agent zones
  Block Editor    — inline add/edit/delete blocks per agent
  LLM Generate    — describe strategy in natural language

Agent Zones
  Data Feed  — NASDAQ, FX, VIX, commodities, Fear & Greed
  Alpha      — momentum, price, volume, AI autonomous decision
  News       — sentiment, keywords, semantic AI filter
  Manager    — buy/sell/DCA/rebalance orders via PancakeSwap
  Risk       — stop loss, take profit, position limits

Smart Contracts (Solidity / BSC + opBNB)
  StrategyRegistry.sol  — strategy registration & ownership
  VaultManager.sol      — fund custody & withdrawal
  ExecutionGateway.sol  — agent execution trigger
```

## Quick Start

```bash
cd web
npm install
cp .env.example .env.local   # add your API key
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Optional | Enables LLM-powered strategy generation. Falls back to keyword parser if absent. |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, React Flow, Tailwind CSS 4 |
| Wallet | wagmi, viem (BSC Testnet + opBNB Testnet) |
| LLM | Anthropic Claude API |
| Smart Contract | Solidity, Hardhat (TBD) |
| Chain | BNB Smart Chain (BSC), opBNB |

## Project Structure

```
web/
  src/
    app/
      page.tsx              — landing page
      strategy/page.tsx     — strategy studio (DAG canvas)
      market/page.tsx       — strategy marketplace
      pricing/page.tsx      — pricing plans
      api/strategy/
        route.ts            — keyword-based strategy parser
        generate/route.ts   — LLM-powered strategy generator
    components/
      FlowCanvas.tsx        — React Flow DAG canvas
      BlockCard.tsx          — inline-editable block card
      BlockPicker.tsx        — per-agent block add dropdown
      Navbar.tsx             — navigation + wallet connect
      WalletProvider.tsx     — wagmi provider wrapper
      nodes/
        AgentZoneNode.tsx    — agent zone node for React Flow
    lib/
      blockRegistry.ts      — block type definitions & metadata
      strategySchema.ts     — LLM prompt, validator, block types
      wagmiConfig.ts        — wagmi chain & connector config
```

## Hackathon

BuidlHack 2026 — BNB Chain Track: Next-Gen Consumer AI ($5,000)

**Submission deadline:** April 17, 2026 23:59 KST

## License

MIT
