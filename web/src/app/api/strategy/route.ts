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
  { keywords: ["vix", "volatility", "implied vol"], agent: "data", block: { type: "feed_vix", fields: { THRESHOLD: 20, OPERATOR: ">=" } } },
  { keywords: ["price change", "% change", "pump", "dump", "급등", "급락"], agent: "data", block: { type: "feed_change_pct", fields: { TOKEN: "BNB", DIRECTION: "up", PCT: 5, PERIOD: "24h" } } },

  // Alpha rules
  { keywords: ["price above", "price over", "price hit", "breakout", "돌파"], agent: "alpha", block: { type: "alpha_when_price", fields: { TOKEN: "BNB", OPERATOR: ">=", VALUE: 300 } } },
  { keywords: ["volume spike", "high volume", "volume surge", "거래량"], agent: "alpha", block: { type: "alpha_when_volume", fields: { MULTIPLIER: 2 } } },
  { keywords: ["rsi", "oversold", "과매도"], agent: "alpha", block: { type: "alpha_rsi", fields: { TOKEN: "BNB", CONDITION: "oversold", THRESHOLD: 30 } } },
  { keywords: ["golden cross", "ma cross", "moving average", "골든크로스"], agent: "alpha", block: { type: "alpha_ma_cross", fields: { TOKEN: "BNB", CROSS: "golden", SHORT: 7, LONG: 25 } } },

  // News rules
  { keywords: ["news", "sentiment", "bullish", "bearish", "뉴스", "감성"], agent: "news", block: { type: "news_when_sentiment", fields: { SENTIMENT: "positive" } } },
  { keywords: ["keyword", "announcement", "upgrade", "listing", "공시", "상장"], agent: "news", block: { type: "news_when_keyword", fields: { KEYWORD: "BNB upgrade", SOURCE: "news" } } },

  // Risk rules
  { keywords: ["stop loss", "stop-loss", "cut loss", "손절"], agent: "risk", block: { type: "risk_set_stop_loss", fields: { PCT: 10 } } },
  { keywords: ["take profit", "profit target", "tp", "익절"], agent: "risk", block: { type: "risk_set_take_profit", fields: { PCT: 20 } } },
  { keywords: ["max position", "position limit", "exposure"], agent: "risk", block: { type: "risk_max_position", fields: { MAX_USDT: 500 } } },
  { keywords: ["drawdown", "portfolio loss", "risk limit", "낙폭"], agent: "risk", block: { type: "risk_if_drawdown", fields: { PCT: 20 }, children: [{ type: "risk_cooldown", fields: { N: 24, UNIT: "hours" } }] } },
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

  // Defaults
  if (agents.alpha.length === 0) {
    agents.alpha.push({ type: "alpha_rsi", fields: { TOKEN: "BNB", CONDITION: "oversold", THRESHOLD: 30 } });
  }

  // Always emit from alpha
  agents.alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: 75 } });

  // Always emit from data if data blocks exist
  if (agents.data.length > 0) {
    agents.data.push({ type: "feed_emit", fields: { SIGNAL: "RISK_ON" } });
  }

  // Always emit from news if news blocks exist
  if (agents.news.length > 0) {
    agents.news.push({ type: "news_emit_signal", fields: { SIGNAL: "BULLISH" } });
  }

  // Manager: C-BLOCK triggers wrapping their actions
  const hasBuy  = lower.includes("buy")  || lower.includes("매수") || lower.includes("long");
  const hasSell = lower.includes("sell") || lower.includes("매도") || lower.includes("exit");

  if (agents.news.length > 0 && hasSell) {
    agents.manager.push({
      type: "mgr_on_alpha", fields: { SIGNAL: "BUY" }, children: [
        { type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } },
      ],
    });
    agents.manager.push({
      type: "mgr_on_news", fields: { SIGNAL: "BEARISH" }, children: [
        { type: "mgr_sell", fields: { AMOUNT_PCT: 100, TOKEN: "BNB" } },
      ],
    });
  } else if (agents.data.length > 0) {
    agents.manager.push({
      type: "mgr_on_data", fields: { SIGNAL: "RISK_ON" }, children: [
        { type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } },
      ],
    });
  } else if (hasSell) {
    agents.manager.push({
      type: "mgr_on_alpha", fields: { SIGNAL: "SELL" }, children: [
        { type: "mgr_sell", fields: { AMOUNT_PCT: 100, TOKEN: "BNB" } },
      ],
    });
  } else {
    agents.manager.push({
      type: "mgr_on_alpha", fields: { SIGNAL: "BUY" }, children: [
        { type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } },
      ],
    });
  }

  // Risk defaults
  if (!agents.risk.some(b => b.type === "risk_set_stop_loss")) {
    agents.risk.unshift({ type: "risk_set_stop_loss", fields: { PCT: 10 } });
  }
  if (!agents.risk.some(b => b.type === "risk_set_take_profit")) {
    agents.risk.push({ type: "risk_set_take_profit", fields: { PCT: 20 } });
  }

  return agents;
}

function generateName(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("dca") || lower.includes("schedule")) return "Periodic DCA Strategy";
  if (lower.includes("rsi") || lower.includes("oversold")) return "RSI BNB Strategy";
  if (lower.includes("golden cross") || lower.includes("ma cross")) return "MA Cross Strategy";
  if (lower.includes("vix") || lower.includes("volatility")) return "Volatility Signal Strategy";
  if (lower.includes("news") || lower.includes("sentiment")) return "News Alpha Strategy";
  if (lower.includes("volume")) return "Volume Spike Strategy";
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
