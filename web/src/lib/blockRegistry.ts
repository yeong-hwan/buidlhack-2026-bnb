/**
 * Block registry — defines all available block types, their fields,
 * and which agent they belong to. This replaces the Blockly block definitions.
 */

export type FieldType =
  | { kind: "number";   min?: number; max?: number; step?: number }
  | { kind: "select";   options: Array<{ label: string; value: string }> }
  | { kind: "text" };

export interface BlockDefinition {
  type: string;
  agent: "data" | "alpha" | "news" | "manager" | "risk";
  keyword: string;
  label: string;
  fields: Record<string, FieldType>;
  defaults: Record<string, string | number>;
  detail: (fields: Record<string, string | number>) => string;
}

const TOKENS = [
  { label: "BNB", value: "BNB" },
  { label: "ETH", value: "ETH" },
  { label: "BTC", value: "BTC" },
  { label: "CAKE", value: "CAKE" },
];

export const BLOCK_REGISTRY: BlockDefinition[] = [
  // ─── Data Feed ────────────────────────────────────────────
  {
    type: "feed_nasdaq", agent: "data", keyword: "feed", label: "NASDAQ futures",
    fields: {
      CONDITION: { kind: "select", options: [{ label: "above 20D MA", value: "above_ma" }, { label: "below 20D MA", value: "below_ma" }, { label: "up >1%", value: "up_1pct" }, { label: "down >1%", value: "down_1pct" }] },
    },
    defaults: { CONDITION: "above_ma" },
    detail: (f) => `${f.CONDITION}`,
  },
  {
    type: "feed_interest_rate", agent: "data", keyword: "feed", label: "Fed rate",
    fields: {
      CHANGE: { kind: "select", options: [{ label: "rate cut", value: "cut" }, { label: "rate hike", value: "hike" }, { label: "any change", value: "any" }] },
    },
    defaults: { CHANGE: "any" },
    detail: (f) => `${f.CHANGE}`,
  },
  {
    type: "feed_fx_rate", agent: "data", keyword: "feed", label: "FX rate",
    fields: {
      PAIR: { kind: "select", options: [{ label: "USD/KRW", value: "USD/KRW" }, { label: "EUR/USD", value: "EUR/USD" }, { label: "DXY", value: "DXY" }] },
      THRESHOLD: { kind: "number", min: 0 },
    },
    defaults: { PAIR: "USD/KRW", THRESHOLD: 1300 },
    detail: (f) => `${f.PAIR}`,
  },
  {
    type: "feed_commodity", agent: "data", keyword: "feed", label: "commodity",
    fields: {
      ASSET: { kind: "select", options: [{ label: "Gold", value: "GOLD" }, { label: "Silver", value: "SILVER" }, { label: "Oil (WTI)", value: "WTI" }] },
      DIRECTION: { kind: "select", options: [{ label: "trending up", value: "up" }, { label: "trending down", value: "down" }] },
    },
    defaults: { ASSET: "GOLD", DIRECTION: "up" },
    detail: (f) => `${f.ASSET} ${f.DIRECTION}`,
  },
  {
    type: "feed_fear_greed", agent: "data", keyword: "feed", label: "Fear & Greed",
    fields: {
      ZONE: { kind: "select", options: [{ label: "Extreme Fear", value: "extreme_fear" }, { label: "Fear", value: "fear" }, { label: "Greed", value: "greed" }, { label: "Extreme Greed", value: "extreme_greed" }] },
    },
    defaults: { ZONE: "extreme_fear" },
    detail: (f) => `${f.ZONE}`,
  },
  {
    type: "feed_vix", agent: "data", keyword: "feed", label: "VIX",
    fields: {
      OPERATOR: { kind: "select", options: [{ label: ">=", value: ">=" }, { label: "<=", value: "<=" }] },
      THRESHOLD: { kind: "number", min: 0 },
    },
    defaults: { OPERATOR: ">=", THRESHOLD: 20 },
    detail: (f) => `${f.OPERATOR} ${f.THRESHOLD}`,
  },
  {
    type: "feed_emit", agent: "data", keyword: "→ out", label: "data signal",
    fields: {
      SIGNAL: { kind: "select", options: [{ label: "RISK ON", value: "RISK_ON" }, { label: "RISK OFF", value: "RISK_OFF" }, { label: "NEUTRAL", value: "NEUTRAL" }] },
    },
    defaults: { SIGNAL: "RISK_OFF" },
    detail: (f) => `${f.SIGNAL}`,
  },

  // ─── Alpha Agent ──────────────────────────────────────────
  {
    type: "alpha_when_momentum", agent: "alpha", keyword: "when", label: "momentum",
    fields: {
      DIRECTION: { kind: "select", options: [{ label: "rises above", value: "above" }, { label: "falls below", value: "below" }] },
      PERIOD: { kind: "number", min: 1, max: 365 },
    },
    defaults: { DIRECTION: "above", PERIOD: 7 },
    detail: (f) => `${f.DIRECTION} · ${f.PERIOD}d`,
  },
  {
    type: "alpha_when_price", agent: "alpha", keyword: "when", label: "price",
    fields: {
      TOKEN: { kind: "select", options: TOKENS.slice(0, 3) },
      OPERATOR: { kind: "select", options: [{ label: ">=", value: ">=" }, { label: "<=", value: "<=" }, { label: ">", value: ">" }, { label: "<", value: "<" }] },
      VALUE: { kind: "number", min: 0 },
    },
    defaults: { TOKEN: "BNB", OPERATOR: ">=", VALUE: 300 },
    detail: (f) => `${f.TOKEN} ${f.OPERATOR} ${f.VALUE}`,
  },
  {
    type: "alpha_when_volume", agent: "alpha", keyword: "when", label: "volume",
    fields: {
      MULTIPLIER: { kind: "number", min: 1, max: 100 },
    },
    defaults: { MULTIPLIER: 2 },
    detail: (f) => `> ${f.MULTIPLIER}× avg`,
  },
  {
    type: "alpha_ai_decide", agent: "alpha", keyword: "AI", label: "autonomous",
    fields: {
      CONTEXT: { kind: "select", options: [{ label: "market conditions", value: "market_conditions" }, { label: "cross-asset signals", value: "cross_asset" }, { label: "all available data", value: "all_data" }] },
      CONFIDENCE: { kind: "number", min: 1, max: 100 },
    },
    defaults: { CONTEXT: "market_conditions", CONFIDENCE: 70 },
    detail: (f) => `${f.CONTEXT} ≥ ${f.CONFIDENCE}%`,
  },
  {
    type: "alpha_emit_signal", agent: "alpha", keyword: "→ out", label: "signal",
    fields: {
      SIGNAL: { kind: "select", options: [{ label: "BUY", value: "BUY" }, { label: "SELL", value: "SELL" }, { label: "HOLD", value: "HOLD" }] },
      STRENGTH: { kind: "number", min: 1, max: 100 },
    },
    defaults: { SIGNAL: "BUY", STRENGTH: 80 },
    detail: (f) => `${f.SIGNAL} · ${f.STRENGTH}%`,
  },

  // ─── News Agent ───────────────────────────────────────────
  {
    type: "news_when_sentiment", agent: "news", keyword: "when", label: "sentiment",
    fields: {
      SENTIMENT: { kind: "select", options: [{ label: "positive", value: "positive" }, { label: "negative", value: "negative" }, { label: "neutral", value: "neutral" }] },
    },
    defaults: { SENTIMENT: "positive" },
    detail: (f) => `${f.SENTIMENT}`,
  },
  {
    type: "news_when_keyword", agent: "news", keyword: "when", label: "keyword",
    fields: {
      KEYWORD: { kind: "text" },
      SOURCE: { kind: "select", options: [{ label: "crypto news", value: "news" }, { label: "Twitter", value: "twitter" }, { label: "Reddit", value: "reddit" }] },
    },
    defaults: { KEYWORD: "BNB upgrade", SOURCE: "news" },
    detail: (f) => `"${f.KEYWORD}"`,
  },
  {
    type: "news_semantic_filter", agent: "news", keyword: "AI", label: "semantic match",
    fields: {
      QUERY: { kind: "text" },
      THRESHOLD: { kind: "number", min: 0, max: 1, step: 0.05 },
    },
    defaults: { QUERY: "bullish market signal", THRESHOLD: 0.7 },
    detail: (f) => `"${f.QUERY}" ≥ ${f.THRESHOLD}`,
  },
  {
    type: "news_emit_signal", agent: "news", keyword: "→ out", label: "news signal",
    fields: {
      SIGNAL: { kind: "select", options: [{ label: "BULLISH", value: "BULLISH" }, { label: "BEARISH", value: "BEARISH" }, { label: "NEUTRAL", value: "NEUTRAL" }] },
    },
    defaults: { SIGNAL: "BULLISH" },
    detail: (f) => `${f.SIGNAL}`,
  },

  // ─── Manager ──────────────────────────────────────────────
  {
    type: "mgr_on_signal", agent: "manager", keyword: "on", label: "signal",
    fields: {
      SIGNAL: { kind: "select", options: [{ label: "BUY", value: "BUY" }, { label: "SELL", value: "SELL" }, { label: "BULLISH", value: "BULLISH" }, { label: "BEARISH", value: "BEARISH" }] },
    },
    defaults: { SIGNAL: "BUY" },
    detail: (f) => `${f.SIGNAL}`,
  },
  {
    type: "mgr_buy", agent: "manager", keyword: "buy", label: "token",
    fields: {
      AMOUNT: { kind: "number", min: 1 },
      TOKEN: { kind: "select", options: TOKENS },
      DEX: { kind: "select", options: [{ label: "PancakeSwap", value: "pancake" }, { label: "market order", value: "market" }] },
    },
    defaults: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" },
    detail: (f) => `${f.AMOUNT} USDT → ${f.TOKEN}`,
  },
  {
    type: "mgr_sell", agent: "manager", keyword: "sell", label: "token",
    fields: {
      AMOUNT_PCT: { kind: "number", min: 1, max: 100 },
      TOKEN: { kind: "select", options: TOKENS },
    },
    defaults: { AMOUNT_PCT: 100, TOKEN: "BNB" },
    detail: (f) => `${f.AMOUNT_PCT}% of ${f.TOKEN}`,
  },
  {
    type: "mgr_dca", agent: "manager", keyword: "dca", label: "order",
    fields: {
      AMOUNT: { kind: "number", min: 1 },
      TOKEN: { kind: "select", options: TOKENS.slice(0, 3) },
      INTERVAL: { kind: "select", options: [{ label: "weekly", value: "weekly" }, { label: "daily", value: "daily" }, { label: "monthly", value: "monthly" }] },
    },
    defaults: { AMOUNT: 100, TOKEN: "BNB", INTERVAL: "weekly" },
    detail: (f) => `${f.AMOUNT} USDT · ${f.INTERVAL}`,
  },
  {
    type: "mgr_rebalance", agent: "manager", keyword: "rebal", label: "portfolio",
    fields: {
      TOKEN: { kind: "select", options: TOKENS.slice(0, 3) },
      TARGET_PCT: { kind: "number", min: 1, max: 99 },
    },
    defaults: { TOKEN: "BNB", TARGET_PCT: 50 },
    detail: (f) => `${f.TOKEN} → ${f.TARGET_PCT}%`,
  },
  {
    type: "mgr_repeat", agent: "manager", keyword: "repeat", label: "every",
    fields: {
      N: { kind: "number", min: 1 },
      UNIT: { kind: "select", options: [{ label: "hours", value: "hours" }, { label: "days", value: "days" }, { label: "weeks", value: "weeks" }] },
    },
    defaults: { N: 1, UNIT: "weeks" },
    detail: (f) => `${f.N} ${f.UNIT}`,
  },

  // ─── Risk Agent ───────────────────────────────────────────
  {
    type: "risk_set_stop_loss", agent: "risk", keyword: "stop", label: "loss",
    fields: {
      PCT: { kind: "number", min: 0.1, max: 99, step: 0.5 },
    },
    defaults: { PCT: 10 },
    detail: (f) => `−${f.PCT}% exit`,
  },
  {
    type: "risk_set_take_profit", agent: "risk", keyword: "take", label: "profit",
    fields: {
      PCT: { kind: "number", min: 0.1, max: 1000, step: 0.5 },
    },
    defaults: { PCT: 20 },
    detail: (f) => `+${f.PCT}% exit`,
  },
  {
    type: "risk_max_position", agent: "risk", keyword: "max", label: "position",
    fields: {
      MAX_USDT: { kind: "number", min: 1 },
    },
    defaults: { MAX_USDT: 500 },
    detail: (f) => `${f.MAX_USDT} USDT`,
  },
  {
    type: "risk_max_drawdown", agent: "risk", keyword: "if", label: "drawdown",
    fields: {
      PCT: { kind: "number", min: 1, max: 100 },
    },
    defaults: { PCT: 20 },
    detail: (f) => `> ${f.PCT}% → pause`,
  },
  {
    type: "risk_daily_loss_limit", agent: "risk", keyword: "daily", label: "loss limit",
    fields: {
      LIMIT_USDT: { kind: "number", min: 1 },
    },
    defaults: { LIMIT_USDT: 100 },
    detail: (f) => `${f.LIMIT_USDT} USDT`,
  },
];

export function getBlocksForAgent(agent: string): BlockDefinition[] {
  return BLOCK_REGISTRY.filter((b) => b.agent === agent);
}

export function getBlockDef(type: string): BlockDefinition | undefined {
  return BLOCK_REGISTRY.find((b) => b.type === type);
}
