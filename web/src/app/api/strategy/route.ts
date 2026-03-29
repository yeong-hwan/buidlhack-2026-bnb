import { NextRequest, NextResponse } from "next/server";

export interface StrategyBlock {
  type: string;
  fields: Record<string, string | number>;
}

export interface AgentBlocks {
  alpha: StrategyBlock[];
  news: StrategyBlock[];
  manager: StrategyBlock[];
  risk: StrategyBlock[];
}

export interface StrategyResponse {
  name: string;
  description: string;
  agents: AgentBlocks;
}

type AgentKey = keyof AgentBlocks;

interface Rule {
  keywords: string[];
  agent: AgentKey;
  block: StrategyBlock;
}

const RULES: Rule[] = [
  // Alpha rules
  { keywords: ["momentum", "trend", "breakout", "pump"], agent: "alpha", block: { type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 7 } } },
  { keywords: ["price above", "price over", "price hit"], agent: "alpha", block: { type: "alpha_when_price", fields: { TOKEN: "BNB", OPERATOR: ">=", VALUE: 300 } } },
  { keywords: ["volume spike", "high volume", "volume surge"], agent: "alpha", block: { type: "alpha_when_volume", fields: { MULTIPLIER: 2 } } },

  // News rules
  { keywords: ["news", "sentiment", "bullish", "bearish"], agent: "news", block: { type: "news_when_sentiment", fields: { SENTIMENT: "positive" } } },
  { keywords: ["keyword", "announcement", "upgrade", "listing"], agent: "news", block: { type: "news_when_keyword", fields: { KEYWORD: "BNB upgrade", SOURCE: "news" } } },

  // Manager rules
  { keywords: ["dca", "dollar cost", "accumulate", "buy regularly"], agent: "manager", block: { type: "mgr_dca", fields: { AMOUNT: 100, TOKEN: "BNB", INTERVAL: "weekly" } } },
  { keywords: ["buy", "long", "enter"], agent: "manager", block: { type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } } },
  { keywords: ["sell", "exit", "close"], agent: "manager", block: { type: "mgr_sell", fields: { AMOUNT_PCT: 100, TOKEN: "BNB" } } },
  { keywords: ["rebalance", "portfolio", "ratio", "maintain"], agent: "manager", block: { type: "mgr_rebalance", fields: { TOKEN: "BNB", TARGET_PCT: 50 } } },
  { keywords: ["every week", "every day", "schedule", "repeat", "weekly", "daily"], agent: "manager", block: { type: "mgr_repeat", fields: { N: 1, UNIT: "weeks" } } },

  // Risk rules
  { keywords: ["stop loss", "stop-loss", "cut loss"], agent: "risk", block: { type: "risk_set_stop_loss", fields: { PCT: 10 } } },
  { keywords: ["take profit", "profit target", "tp"], agent: "risk", block: { type: "risk_set_take_profit", fields: { PCT: 20 } } },
  { keywords: ["max position", "position limit", "exposure"], agent: "risk", block: { type: "risk_max_position", fields: { MAX_USDT: 500 } } },
  { keywords: ["drawdown", "portfolio loss", "risk limit"], agent: "risk", block: { type: "risk_max_drawdown", fields: { PCT: 20 } } },
  { keywords: ["daily limit", "daily loss", "loss cap"], agent: "risk", block: { type: "risk_daily_loss_limit", fields: { LIMIT_USDT: 100 } } },
];

function parseAgents(input: string): AgentBlocks {
  const lower = input.toLowerCase();
  const agents: AgentBlocks = { alpha: [], news: [], manager: [], risk: [] };
  const seen = new Set<string>();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw)) && !seen.has(rule.block.type)) {
      seen.add(rule.block.type);
      agents[rule.agent].push({ ...rule.block, fields: { ...rule.block.fields } });
    }
  }

  // Fallbacks per agent
  if (agents.alpha.length === 0) {
    agents.alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 7 } });
  }
  if (agents.manager.length === 0) {
    agents.manager.push({ type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } });
  }
  if (agents.risk.length === 0) {
    agents.risk.push({ type: "risk_set_stop_loss", fields: { PCT: 10 } });
  }

  return agents;
}

function generateName(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("dca")) return "DCA Accumulation Strategy";
  if (lower.includes("momentum")) return "Momentum Strategy";
  if (lower.includes("rebalance")) return "Portfolio Rebalance Strategy";
  if (lower.includes("news") || lower.includes("sentiment")) return "News Alpha Strategy";
  return "Custom Strategy";
}

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const response: StrategyResponse = {
    name: generateName(input),
    description: input,
    agents: parseAgents(input),
  };

  return NextResponse.json(response);
}
