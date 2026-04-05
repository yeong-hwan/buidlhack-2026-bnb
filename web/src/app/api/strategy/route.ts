import { NextRequest, NextResponse } from "next/server";

export interface StrategyBlock {
  type: string;
  fields: Record<string, string | number>;
  children?: StrategyBlock[];
}

export interface AgentBlocks {
  data:    StrategyBlock[];
  alpha:   StrategyBlock[];
  news:    StrategyBlock[];
  manager: StrategyBlock[];
  risk:    StrategyBlock[];
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
  // Data Feed rules
  { keywords: ["nasdaq", "us market", "s&p", "snp", "spx"], agent: "data", block: { type: "feed_nasdaq", fields: { ASSET: "NQ1!", CONDITION: "above_ma", PERIOD: 20 } } },
  { keywords: ["interest rate", "fed", "federal reserve", "rate hike", "rate cut"], agent: "data", block: { type: "feed_interest_rate", fields: { SOURCE: "fed_funds", CHANGE: "any" } } },
  { keywords: ["exchange rate", "fx", "usd", "eur", "환율"], agent: "data", block: { type: "feed_fx_rate", fields: { PAIR: "USD/KRW", THRESHOLD: 1300 } } },
  { keywords: ["gold", "silver", "commodity"], agent: "data", block: { type: "feed_commodity", fields: { ASSET: "GOLD", DIRECTION: "up" } } },
  { keywords: ["fear", "greed", "fear and greed", "sentiment index"], agent: "data", block: { type: "feed_fear_greed", fields: { ZONE: "extreme_fear" } } },
  { keywords: ["vix", "volatility", "implied vol"], agent: "data", block: { type: "feed_vix", fields: { THRESHOLD: 20, OPERATOR: ">=" } } },

  // Alpha rules
  { keywords: ["momentum", "trend", "breakout", "pump"], agent: "alpha", block: { type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 7 } } },
  { keywords: ["price above", "price over", "price hit"], agent: "alpha", block: { type: "alpha_when_price", fields: { TOKEN: "BNB", OPERATOR: ">=", VALUE: 300 } } },
  { keywords: ["volume spike", "high volume", "volume surge"], agent: "alpha", block: { type: "alpha_when_volume", fields: { MULTIPLIER: 2 } } },
  { keywords: ["ai decide", "ai signal", "let ai", "autonomous", "ai judge"], agent: "alpha", block: { type: "alpha_ai_decide", fields: { CONTEXT: "market_conditions", CONFIDENCE: 70 } } },

  // News / Semantic rules
  { keywords: ["news", "sentiment", "bullish", "bearish"], agent: "news", block: { type: "news_when_sentiment", fields: { SENTIMENT: "positive" } } },
  { keywords: ["keyword", "announcement", "upgrade", "listing"], agent: "news", block: { type: "news_when_keyword", fields: { KEYWORD: "BNB upgrade", SOURCE: "news" } } },
  { keywords: ["semantic", "context", "meaning", "interpret", "언어"], agent: "news", block: { type: "news_semantic_filter", fields: { QUERY: "bullish market signal", THRESHOLD: 0.7 } } },
  { keywords: ["fed statement", "central bank", "policy", "macro event"], agent: "news", block: { type: "news_semantic_filter", fields: { QUERY: "dovish fed policy", THRESHOLD: 0.75 } } },

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
  const agents: AgentBlocks = { data: [], alpha: [], news: [], manager: [], risk: [] };
  const seen = new Set<string>();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw)) && !seen.has(rule.block.type)) {
      seen.add(rule.block.type);
      agents[rule.agent].push({ ...rule.block, fields: { ...rule.block.fields } });
    }
  }

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
  if (lower.includes("nasdaq") || lower.includes("macro")) return "Macro-Aware Strategy";
  if (lower.includes("news") || lower.includes("sentiment")) return "News Alpha Strategy";
  if (lower.includes("semantic") || lower.includes("fed")) return "Semantic Strategy";
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
