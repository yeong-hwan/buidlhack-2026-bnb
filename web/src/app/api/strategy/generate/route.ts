import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  validateStrategyResult,
  type StrategyGenerationResult,
  type StrategyBlock,
} from "@/lib/strategySchema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Smart Mock ───────────────────────────────────────────────────────────────

function has(lower: string, ...words: string[]): boolean {
  return words.some((w) => lower.includes(w));
}

function generateMockStrategy(input: string): StrategyGenerationResult {
  const lower = input.toLowerCase();

  const data: StrategyBlock[] = [];
  const alpha: StrategyBlock[] = [];
  const news: StrategyBlock[] = [];
  const manager: StrategyBlock[] = [];
  const risk: StrategyBlock[] = [];

  // ── Data layer ──────────────────────────────────────────────────────────────
  if (has(lower, "nasdaq", "us market", "s&p", "spx", "snp")) {
    data.push({ type: "feed_nasdaq", fields: { CONDITION: "above_ma" } });
  }
  if (has(lower, "fear", "greed", "sentiment index", "market mood")) {
    data.push({ type: "feed_fear_greed", fields: { ZONE: "extreme_fear" } });
  }
  if (has(lower, "vix", "volatility", "implied vol")) {
    data.push({ type: "feed_vix", fields: { OPERATOR: ">=", THRESHOLD: 25 } });
  }
  if (has(lower, "gold", "silver", "commodity", "oil", "wti")) {
    data.push({ type: "feed_commodity", fields: { ASSET: "GOLD", DIRECTION: "up" } });
  }
  if (has(lower, "interest rate", "fed", "federal reserve", "rate hike", "rate cut")) {
    data.push({ type: "feed_interest_rate", fields: { CHANGE: "cut" } });
  }
  if (has(lower, "fx", "usd", "eur", "exchange rate", "currency")) {
    data.push({ type: "feed_fx_rate", fields: { PAIR: "DXY", THRESHOLD: 104 } });
  }
  if (has(lower, "autonomous", "ai trading", "fully automated") && data.length === 0) {
    data.push({ type: "feed_vix", fields: { OPERATOR: ">=", THRESHOLD: 20 } });
    data.push({ type: "feed_fear_greed", fields: { ZONE: "fear" } });
  }
  // Emit data signal when data feeds are present and strategy has downstream logic
  if (data.length > 0 && has(lower, "autonomous", "ai", "signal", "macro", "cross")) {
    data.push({ type: "feed_emit", fields: { SIGNAL: "RISK_ON" } });
  }

  // ── Alpha layer ─────────────────────────────────────────────────────────────
  if (has(lower, "autonomous", "ai decide", "ai signal", "let ai", "ai judge", "ai trading")) {
    alpha.push({ type: "alpha_ai_decide", fields: { CONTEXT: "all_data", CONFIDENCE: 75 } });
    alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: 80 } });
  } else if (has(lower, "momentum", "trend", "breakout", "pump", "bullish run")) {
    alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 14 } });
  } else if (has(lower, "price", "price above", "price over", "hit", "reach", "target")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const value = has(lower, "eth") ? 3000 : has(lower, "btc") ? 60000 : 300;
    alpha.push({ type: "alpha_when_price", fields: { TOKEN: token, OPERATOR: ">=", VALUE: value } });
  } else if (has(lower, "volume", "spike", "surge")) {
    alpha.push({ type: "alpha_when_volume", fields: { MULTIPLIER: 2 } });
  } else if (!has(lower, "rebalance", "portfolio ratio")) {
    // Default: momentum signal
    alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 7 } });
  }

  // ── News layer ──────────────────────────────────────────────────────────────
  if (has(lower, "autonomous", "ai trading", "fully automated")) {
    news.push({ type: "news_semantic_filter", fields: { QUERY: "bullish market signal", THRESHOLD: 0.7 } });
    news.push({ type: "news_emit_signal", fields: { SIGNAL: "BULLISH" } });
  } else if (has(lower, "news", "sentiment", "bullish news", "bearish news")) {
    const sentiment = has(lower, "bearish") ? "negative" : "positive";
    news.push({ type: "news_when_sentiment", fields: { SENTIMENT: sentiment } });
    if (has(lower, "semantic", "filter", "context")) {
      news.push({ type: "news_semantic_filter", fields: { QUERY: "bullish crypto signal", THRESHOLD: 0.65 } });
    }
    news.push({ type: "news_emit_signal", fields: { SIGNAL: has(lower, "bearish") ? "BEARISH" : "BULLISH" } });
  } else if (has(lower, "announcement", "listing", "upgrade", "keyword")) {
    news.push({ type: "news_when_keyword", fields: { KEYWORD: "BNB upgrade", SOURCE: "news" } });
    news.push({ type: "news_emit_signal", fields: { SIGNAL: "BULLISH" } });
  } else if (has(lower, "semantic", "interpret", "meaning", "language")) {
    news.push({ type: "news_semantic_filter", fields: { QUERY: "market sentiment analysis", THRESHOLD: 0.7 } });
    news.push({ type: "news_emit_signal", fields: { SIGNAL: "BULLISH" } });
  }

  // ── Manager layer ────────────────────────────────────────────────────────────
  if (has(lower, "autonomous", "ai trading", "fully automated")) {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    manager.push({ type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } });
    manager.push({ type: "mgr_sell", fields: { AMOUNT_PCT: 50, TOKEN: "BNB" } });
  } else if (has(lower, "dca", "dollar cost", "accumulate", "buy regularly", "every week", "weekly", "every month", "monthly")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const interval = has(lower, "daily", "every day") ? "daily" : has(lower, "monthly", "every month") ? "monthly" : "weekly";
    const amount = has(lower, "500") ? 500 : has(lower, "200") ? 200 : has(lower, "50") ? 50 : 100;
    manager.push({ type: "mgr_dca", fields: { AMOUNT: amount, TOKEN: token, INTERVAL: interval } });
    manager.push({ type: "mgr_repeat", fields: { N: 1, UNIT: interval === "daily" ? "days" : interval === "monthly" ? "weeks" : "weeks" } });
  } else if (has(lower, "rebalance", "50/50", "portfolio ratio", "maintain ratio")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const targetPct = has(lower, "30") ? 30 : has(lower, "60") ? 60 : has(lower, "40") ? 40 : 50;
    manager.push({ type: "mgr_rebalance", fields: { TOKEN: token, TARGET_PCT: targetPct } });
    manager.push({ type: "mgr_repeat", fields: { N: 7, UNIT: "days" } });
  } else if (has(lower, "sell", "exit", "close position")) {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "SELL" } });
    manager.push({ type: "mgr_sell", fields: { AMOUNT_PCT: 100, TOKEN: "BNB" } });
  } else {
    // Default: signal-triggered buy
    if (news.length > 0 || data.length > 0) {
      manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    }
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    manager.push({ type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: token, DEX: "pancake" } });
  }

  // ── Risk layer ───────────────────────────────────────────────────────────────
  if (has(lower, "stop loss", "stop-loss", "cut loss")) {
    const pct = has(lower, "5%", "5 percent") ? 5 : has(lower, "15%", "15 percent") ? 15 : has(lower, "20%", "20 percent") ? 20 : 10;
    risk.push({ type: "risk_set_stop_loss", fields: { PCT: pct } });
  } else {
    // Always add a default stop loss
    risk.push({ type: "risk_set_stop_loss", fields: { PCT: 10 } });
  }

  if (has(lower, "take profit", "profit target", "tp", "target")) {
    const pct = has(lower, "30%", "30 percent") ? 30 : has(lower, "50%", "50 percent") ? 50 : 20;
    risk.push({ type: "risk_set_take_profit", fields: { PCT: pct } });
  } else if (has(lower, "autonomous", "ai trading", "aggressive")) {
    risk.push({ type: "risk_set_take_profit", fields: { PCT: 25 } });
  }

  if (has(lower, "drawdown", "max loss", "risk limit", "portfolio loss", "rebalance", "autonomous")) {
    const pct = has(lower, "30%", "30 percent") ? 30 : has(lower, "10%", "10 percent") ? 10 : 20;
    risk.push({ type: "risk_max_drawdown", fields: { PCT: pct } });
  }

  if (has(lower, "max position", "position limit", "exposure", "cap")) {
    risk.push({ type: "risk_max_position", fields: { MAX_USDT: 500 } });
  } else if (has(lower, "rebalance", "autonomous")) {
    risk.push({ type: "risk_max_position", fields: { MAX_USDT: 1000 } });
  }

  if (has(lower, "daily limit", "daily loss", "loss cap")) {
    risk.push({ type: "risk_daily_loss_limit", fields: { LIMIT_USDT: 100 } });
  }

  // ── Name generation ──────────────────────────────────────────────────────────
  let name = "Custom Trading Strategy";
  if (has(lower, "autonomous", "ai trading", "fully automated")) {
    name = "Autonomous AI Strategy";
  } else if (has(lower, "dca", "dollar cost", "accumulate")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    name = `DCA ${token} Strategy`;
  } else if (has(lower, "rebalance", "50/50", "portfolio ratio")) {
    name = "Portfolio Rebalance Strategy";
  } else if (has(lower, "nasdaq", "macro", "cross-asset")) {
    name = "Macro-Linked BNB Strategy";
  } else if (has(lower, "news", "sentiment", "bullish news")) {
    name = "News Sentiment Strategy";
  } else if (has(lower, "momentum", "trend", "breakout")) {
    name = "Momentum Breakout Strategy";
  } else if (has(lower, "price", "target", "hit")) {
    name = "Price Target Strategy";
  } else if (has(lower, "vix", "fear", "volatility")) {
    name = "Volatility Signal Strategy";
  }

  const description = `Strategy generated from: "${input.slice(0, 120)}${input.length > 120 ? "…" : ""}"`;

  return validateStrategyResult({ name, description, agents: { data, alpha, news, manager, risk } });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  // Try real Anthropic API first
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: input }],
      });
      const rawText = message.content[0].type === "text" ? message.content[0].text : "";

      // Strip potential markdown code fences
      const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        console.warn("[strategy/generate] LLM returned invalid JSON — falling back to mock");
        return NextResponse.json(generateMockStrategy(input));
      }

      let result: StrategyGenerationResult;
      try {
        result = validateStrategyResult(parsed);
        return NextResponse.json(result);
      } catch (e) {
        console.warn("[strategy/generate] Schema validation failed — falling back to mock:", (e as Error).message);
        return NextResponse.json(generateMockStrategy(input));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown API error";
      console.warn("[strategy/generate] Anthropic API error — falling back to mock:", msg);
      // Fall through to mock below
    }
  } else {
    console.warn("[strategy/generate] No ANTHROPIC_API_KEY — using mock");
  }

  // Smart mock fallback
  return NextResponse.json(generateMockStrategy(input));
}
