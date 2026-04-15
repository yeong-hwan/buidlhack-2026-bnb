/**
 * Block Registry — 24-block minimal language
 *
 * Design principles:
 *  - Signal source is always explicit (mgr_on_alpha / mgr_on_news / mgr_on_data)
 *  - Manager triggers are C-BLOCKs — each trigger wraps its own actions
 *  - Risk blocks are always-on guardrails, never event-triggered
 *  - Every block must be intuitively understandable
 */

export type FieldType =
  | { kind: "number";  min?: number; max?: number; step?: number }
  | { kind: "select";  options: Array<{ label: string; value: string }> }
  | { kind: "text" };

export type BlockShape = "hat" | "stack" | "cblock" | "cap";

export interface BlockDefinition {
  type: string;
  agent: "data" | "alpha" | "news" | "manager" | "risk";
  keyword: string;
  label: string;
  shape: BlockShape;
  fields: Record<string, FieldType>;
  defaults: Record<string, string | number>;
  detail: (fields: Record<string, string | number>) => string;
}

const TOKENS = [
  { label: "BNB",  value: "BNB" },
  { label: "ETH",  value: "ETH" },
  { label: "BTC",  value: "BTC" },
];

const OPERATORS = [
  { label: ">=", value: ">=" },
  { label: "<=", value: "<=" },
  { label: ">",  value: ">"  },
  { label: "<",  value: "<"  },
];

export const BLOCK_REGISTRY: BlockDefinition[] = [

  // ─── Data Feed ────────────────────────────────────────────────────────────
  // Role: Monitor macro signals → emit RISK_ON / RISK_OFF / NEUTRAL

  {
    type: "feed_price", agent: "data", keyword: "price", label: "price",
    shape: "hat",
    fields: {
      TOKEN:    { kind: "select", options: TOKENS },
      OPERATOR: { kind: "select", options: OPERATORS },
      VALUE:    { kind: "number", min: 0 },
    },
    defaults: { TOKEN: "BNB", OPERATOR: ">=", VALUE: 300 },
    detail: (f) => `${f.TOKEN} ${f.OPERATOR} $${f.VALUE}`,
  },
  {
    type: "feed_change_pct", agent: "data", keyword: "change", label: "% change",
    shape: "hat",
    fields: {
      TOKEN:     { kind: "select", options: TOKENS },
      DIRECTION: { kind: "select", options: [{ label: "up", value: "up" }, { label: "down", value: "down" }] },
      PCT:       { kind: "number", min: 0.1, max: 100, step: 0.5 },
      PERIOD:    { kind: "select", options: [{ label: "1h", value: "1h" }, { label: "4h", value: "4h" }, { label: "24h", value: "24h" }, { label: "7d", value: "7d" }] },
    },
    defaults: { TOKEN: "BNB", DIRECTION: "up", PCT: 5, PERIOD: "24h" },
    detail: (f) => `${f.TOKEN} ${f.DIRECTION} ${f.PCT}% / ${f.PERIOD}`,
  },
  {
    type: "feed_vix", agent: "data", keyword: "vix", label: "VIX",
    shape: "hat",
    fields: {
      OPERATOR:  { kind: "select", options: [{ label: ">=", value: ">=" }, { label: "<=", value: "<=" }] },
      THRESHOLD: { kind: "number", min: 0 },
    },
    defaults: { OPERATOR: ">=", THRESHOLD: 20 },
    detail: (f) => `VIX ${f.OPERATOR} ${f.THRESHOLD}`,
  },
  {
    type: "feed_emit", agent: "data", keyword: "→ out", label: "data signal",
    shape: "cap",
    fields: {
      SIGNAL: { kind: "select", options: [{ label: "RISK ON", value: "RISK_ON" }, { label: "RISK OFF", value: "RISK_OFF" }, { label: "NEUTRAL", value: "NEUTRAL" }] },
    },
    defaults: { SIGNAL: "RISK_OFF" },
    detail: (f) => String(f.SIGNAL),
  },

  // ─── Alpha Agent ──────────────────────────────────────────────────────────
  // Role: Detect technical signals → emit BUY / SELL / HOLD

  {
    type: "alpha_when_price", agent: "alpha", keyword: "when", label: "price",
    shape: "hat",
    fields: {
      TOKEN:    { kind: "select", options: TOKENS },
      OPERATOR: { kind: "select", options: OPERATORS },
      VALUE:    { kind: "number", min: 0 },
    },
    defaults: { TOKEN: "BNB", OPERATOR: ">=", VALUE: 300 },
    detail: (f) => `${f.TOKEN} ${f.OPERATOR} $${f.VALUE}`,
  },
  {
    type: "alpha_when_volume", agent: "alpha", keyword: "when", label: "volume surge",
    shape: "hat",
    fields: {
      MULTIPLIER: { kind: "number", min: 1, max: 100 },
    },
    defaults: { MULTIPLIER: 2 },
    detail: (f) => `> ${f.MULTIPLIER}× avg`,
  },
  {
    type: "alpha_rsi", agent: "alpha", keyword: "rsi", label: "RSI",
    shape: "hat",
    fields: {
      TOKEN:     { kind: "select", options: TOKENS },
      CONDITION: { kind: "select", options: [{ label: "oversold", value: "oversold" }, { label: "overbought", value: "overbought" }] },
      THRESHOLD: { kind: "number", min: 0, max: 100 },
    },
    defaults: { TOKEN: "BNB", CONDITION: "oversold", THRESHOLD: 30 },
    detail: (f) => `${f.TOKEN} RSI ${f.CONDITION} ${f.THRESHOLD}`,
  },
  {
    type: "alpha_ma_cross", agent: "alpha", keyword: "ma", label: "MA cross",
    shape: "hat",
    fields: {
      TOKEN: { kind: "select", options: TOKENS },
      CROSS: { kind: "select", options: [{ label: "golden cross", value: "golden" }, { label: "death cross", value: "death" }] },
      SHORT: { kind: "number", min: 1, max: 200 },
      LONG:  { kind: "number", min: 2, max: 500 },
    },
    defaults: { TOKEN: "BNB", CROSS: "golden", SHORT: 7, LONG: 25 },
    detail: (f) => `${f.TOKEN} MA${f.SHORT}×${f.LONG} ${f.CROSS}`,
  },
  {
    type: "alpha_emit_signal", agent: "alpha", keyword: "→ out", label: "signal",
    shape: "cap",
    fields: {
      SIGNAL:   { kind: "select", options: [{ label: "BUY", value: "BUY" }, { label: "SELL", value: "SELL" }, { label: "HOLD", value: "HOLD" }] },
      STRENGTH: { kind: "number", min: 1, max: 100 },
    },
    defaults: { SIGNAL: "BUY", STRENGTH: 80 },
    detail: (f) => `${f.SIGNAL} · ${f.STRENGTH}%`,
  },

  // ─── News Agent ───────────────────────────────────────────────────────────
  // Role: Monitor sentiment → emit BULLISH / BEARISH / NEUTRAL

  {
    type: "news_when_keyword", agent: "news", keyword: "when", label: "keyword",
    shape: "hat",
    fields: {
      KEYWORD: { kind: "text" },
      SOURCE:  { kind: "select", options: [{ label: "crypto news", value: "news" }, { label: "Twitter/X", value: "twitter" }, { label: "Reddit", value: "reddit" }] },
    },
    defaults: { KEYWORD: "BNB upgrade", SOURCE: "news" },
    detail: (f) => `"${f.KEYWORD}"`,
  },
  {
    type: "news_when_sentiment", agent: "news", keyword: "when", label: "sentiment",
    shape: "hat",
    fields: {
      SENTIMENT: { kind: "select", options: [{ label: "positive", value: "positive" }, { label: "negative", value: "negative" }, { label: "neutral", value: "neutral" }] },
    },
    defaults: { SENTIMENT: "positive" },
    detail: (f) => String(f.SENTIMENT),
  },
  {
    type: "news_emit_signal", agent: "news", keyword: "→ out", label: "news signal",
    shape: "cap",
    fields: {
      SIGNAL: { kind: "select", options: [{ label: "BULLISH", value: "BULLISH" }, { label: "BEARISH", value: "BEARISH" }, { label: "NEUTRAL", value: "NEUTRAL" }] },
    },
    defaults: { SIGNAL: "BULLISH" },
    detail: (f) => String(f.SIGNAL),
  },

  // ─── Manager ──────────────────────────────────────────────────────────────
  // Role: React to signals → execute on-chain orders
  //
  // Trigger C-BLOCKs — each wraps its own set of actions:
  //   mgr_on_alpha  → reacts to Alpha agent signals (BUY / SELL / HOLD)
  //   mgr_on_news   → reacts to News agent signals  (BULLISH / BEARISH / NEUTRAL)
  //   mgr_on_data   → reacts to Data agent signals  (RISK_ON / RISK_OFF / NEUTRAL)
  //   mgr_schedule  → time-based execution (every N hours / days / weeks)
  //
  // Conditional C-BLOCK:
  //   mgr_if_signal → branch within a flow based on signal value

  {
    type: "mgr_on_alpha", agent: "manager", keyword: "on alpha", label: "signal",
    shape: "cblock",
    fields: {
      SIGNAL: { kind: "select", options: [
        { label: "BUY",  value: "BUY"  },
        { label: "SELL", value: "SELL" },
        { label: "HOLD", value: "HOLD" },
      ]},
    },
    defaults: { SIGNAL: "BUY" },
    detail: (f) => `alpha → ${f.SIGNAL}`,
  },
  {
    type: "mgr_on_news", agent: "manager", keyword: "on news", label: "signal",
    shape: "cblock",
    fields: {
      SIGNAL: { kind: "select", options: [
        { label: "BULLISH", value: "BULLISH" },
        { label: "BEARISH", value: "BEARISH" },
        { label: "NEUTRAL", value: "NEUTRAL" },
      ]},
    },
    defaults: { SIGNAL: "BULLISH" },
    detail: (f) => `news → ${f.SIGNAL}`,
  },
  {
    type: "mgr_on_data", agent: "manager", keyword: "on data", label: "signal",
    shape: "cblock",
    fields: {
      SIGNAL: { kind: "select", options: [
        { label: "RISK ON",  value: "RISK_ON"  },
        { label: "RISK OFF", value: "RISK_OFF" },
        { label: "NEUTRAL",  value: "NEUTRAL"  },
      ]},
    },
    defaults: { SIGNAL: "RISK_ON" },
    detail: (f) => `data → ${f.SIGNAL}`,
  },
  {
    type: "mgr_schedule", agent: "manager", keyword: "schedule", label: "every",
    shape: "cblock",
    fields: {
      N:    { kind: "number", min: 1 },
      UNIT: { kind: "select", options: [{ label: "hours", value: "hours" }, { label: "days", value: "days" }, { label: "weeks", value: "weeks" }] },
    },
    defaults: { N: 1, UNIT: "days" },
    detail: (f) => `every ${f.N} ${f.UNIT}`,
  },
  {
    type: "mgr_if_signal", agent: "manager", keyword: "if", label: "signal =",
    shape: "cblock",
    fields: {
      SIGNAL: { kind: "select", options: [
        { label: "BUY",     value: "BUY"     },
        { label: "SELL",    value: "SELL"    },
        { label: "HOLD",    value: "HOLD"    },
        { label: "BULLISH", value: "BULLISH" },
        { label: "BEARISH", value: "BEARISH" },
        { label: "RISK ON", value: "RISK_ON" },
        { label: "RISK OFF",value: "RISK_OFF"},
      ]},
    },
    defaults: { SIGNAL: "BUY" },
    detail: (f) => `if signal = ${f.SIGNAL}`,
  },
  {
    type: "mgr_buy", agent: "manager", keyword: "buy", label: "token",
    shape: "stack",
    fields: {
      AMOUNT: { kind: "number", min: 1 },
      TOKEN:  { kind: "select", options: TOKENS },
      DEX:    { kind: "select", options: [{ label: "PancakeSwap", value: "pancake" }, { label: "market order", value: "market" }] },
    },
    defaults: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" },
    detail: (f) => `${f.AMOUNT} USDT → ${f.TOKEN}`,
  },
  {
    type: "mgr_sell", agent: "manager", keyword: "sell", label: "token",
    shape: "stack",
    fields: {
      AMOUNT_PCT: { kind: "number", min: 1, max: 100 },
      TOKEN:      { kind: "select", options: TOKENS },
    },
    defaults: { AMOUNT_PCT: 100, TOKEN: "BNB" },
    detail: (f) => `${f.AMOUNT_PCT}% of ${f.TOKEN}`,
  },

  // ─── Risk Agent ───────────────────────────────────────────────────────────
  // Role: Always-on guardrails — stateful rules enforced continuously
  // NOTE: Risk blocks do NOT need a trigger. They are active from strategy start.

  {
    type: "risk_set_stop_loss", agent: "risk", keyword: "stop", label: "loss",
    shape: "stack",
    fields: {
      PCT: { kind: "number", min: 0.1, max: 99, step: 0.5 },
    },
    defaults: { PCT: 10 },
    detail: (f) => `−${f.PCT}% exit`,
  },
  {
    type: "risk_set_take_profit", agent: "risk", keyword: "take", label: "profit",
    shape: "stack",
    fields: {
      PCT: { kind: "number", min: 0.1, max: 1000, step: 0.5 },
    },
    defaults: { PCT: 20 },
    detail: (f) => `+${f.PCT}% exit`,
  },
  {
    type: "risk_max_position", agent: "risk", keyword: "max", label: "position",
    shape: "stack",
    fields: {
      MAX_USDT: { kind: "number", min: 1 },
    },
    defaults: { MAX_USDT: 500 },
    detail: (f) => `${f.MAX_USDT} USDT`,
  },
  {
    type: "risk_if_drawdown", agent: "risk", keyword: "if", label: "drawdown >",
    shape: "cblock",
    fields: {
      PCT: { kind: "number", min: 1, max: 100 },
    },
    defaults: { PCT: 20 },
    detail: (f) => `drawdown > ${f.PCT}%`,
  },
  {
    type: "risk_cooldown", agent: "risk", keyword: "wait", label: "cooldown",
    shape: "stack",
    fields: {
      N:    { kind: "number", min: 1 },
      UNIT: { kind: "select", options: [{ label: "hours", value: "hours" }, { label: "days", value: "days" }] },
    },
    defaults: { N: 24, UNIT: "hours" },
    detail: (f) => `${f.N} ${f.UNIT} pause`,
  },
];

export function getBlocksForAgent(agent: string): BlockDefinition[] {
  return BLOCK_REGISTRY.filter((b) => b.agent === agent);
}

export function getBlockDef(type: string): BlockDefinition | undefined {
  return BLOCK_REGISTRY.find((b) => b.type === type);
}
