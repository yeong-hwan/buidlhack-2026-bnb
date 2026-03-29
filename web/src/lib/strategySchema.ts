/**
 * Strategy Generation Protocol
 *
 * This module defines the canonical schema and prompt harness
 * for LLM-based strategy block generation.
 *
 * Protocol:
 *   Input  → natural language strategy description (string)
 *   Output → StrategyGenerationResult (strict JSON, validated below)
 *
 * The LLM must always output valid JSON conforming to StrategyGenerationResult.
 * Any deviation is rejected and falls back to the keyword-based parser.
 */

// ─── Output Schema ────────────────────────────────────────────────────────────

export interface StrategyBlock {
  type: BlockType;
  fields: Record<string, string | number>;
}

export interface StrategyGenerationResult {
  name: string;
  description: string;
  agents: {
    data:    StrategyBlock[];
    alpha:   StrategyBlock[];
    news:    StrategyBlock[];
    manager: StrategyBlock[];
    risk:    StrategyBlock[];
  };
}

// ─── Valid Block Types ────────────────────────────────────────────────────────

export const BLOCK_TYPES = {
  // Data feed: cross-asset market data signals
  feed_nasdaq:         { CONDITION: "above_ma|below_ma|up_1pct|down_1pct" },
  feed_interest_rate:  { CHANGE: "cut|hike|any" },
  feed_fx_rate:        { PAIR: "USD/KRW|EUR/USD|DXY", THRESHOLD: "number" },
  feed_commodity:      { ASSET: "GOLD|SILVER|WTI", DIRECTION: "up|down" },
  feed_fear_greed:     { ZONE: "extreme_fear|fear|greed|extreme_greed" },
  feed_vix:            { OPERATOR: ">=|<=", THRESHOLD: "number" },
  feed_emit:           { SIGNAL: "RISK_ON|RISK_OFF|NEUTRAL" },

  // Alpha agent: detects market signals
  alpha_when_momentum:   { DIRECTION: "above|below",    PERIOD: "number(1-365)" },
  alpha_when_price:      { TOKEN: "BNB|ETH|BTC",        OPERATOR: ">=|<=|>|<", VALUE: "number" },
  alpha_when_volume:     { MULTIPLIER: "number(1-100)" },
  alpha_ai_decide:       { CONTEXT: "market_conditions|cross_asset|all_data", CONFIDENCE: "number(1-100)" },
  alpha_emit_signal:     { SIGNAL: "BUY|SELL|HOLD",     STRENGTH: "number(1-100)" },

  // News agent: monitors sentiment and keywords
  news_when_sentiment:   { SENTIMENT: "positive|negative|neutral" },
  news_when_keyword:     { KEYWORD: "string",           SOURCE: "news|twitter|reddit" },
  news_semantic_filter:  { QUERY: "string",             THRESHOLD: "number(0-1)" },
  news_emit_signal:      { SIGNAL: "BULLISH|BEARISH|NEUTRAL" },

  // Manager agent: constructs and executes orders
  mgr_on_signal:         { SIGNAL: "BUY|SELL|BULLISH|BEARISH" },
  mgr_buy:               { AMOUNT: "number",            TOKEN: "BNB|ETH|BTC|CAKE", DEX: "pancake|market" },
  mgr_sell:              { AMOUNT_PCT: "number(1-100)", TOKEN: "BNB|ETH|BTC|CAKE" },
  mgr_dca:               { AMOUNT: "number",            TOKEN: "BNB|ETH|BTC",      INTERVAL: "weekly|daily|monthly" },
  mgr_rebalance:         { TOKEN: "BNB|ETH|BTC",        TARGET_PCT: "number(1-99)" },
  mgr_repeat:            { N: "number",                 UNIT: "hours|days|weeks" },

  // Risk agent: enforces guardrails
  risk_set_stop_loss:    { PCT: "number(0.1-99)" },
  risk_set_take_profit:  { PCT: "number(0.1-1000)" },
  risk_max_position:     { MAX_USDT: "number" },
  risk_max_drawdown:     { PCT: "number(1-100)" },
  risk_daily_loss_limit: { LIMIT_USDT: "number" },
} as const;

export type BlockType = keyof typeof BLOCK_TYPES;

// ─── Prompt Harness ───────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a strategy compiler for an on-chain trading agent platform.

Your job is to convert a natural language strategy description into a structured JSON object that defines blocks for 5 isolated agent layers:

- data:    Cross-asset market data feeds (NASDAQ, FX rates, VIX, commodities, Fear & Greed). Emits RISK_ON/RISK_OFF/NEUTRAL signals.
- alpha:   Detects crypto-specific market signals (price, momentum, volume). Can use AI autonomous decision. Emits BUY/SELL/HOLD signals.
- news:    Monitors news sentiment and keywords. Supports semantic AI filtering. Emits BULLISH/BEARISH/NEUTRAL signals.
- manager: Listens to agent signals and constructs actual on-chain orders.
- risk:    Sets guardrails that apply globally (stop loss, take profit, position limits).

VALID BLOCK TYPES AND THEIR FIELDS:
${Object.entries(BLOCK_TYPES)
  .map(([type, fields]) =>
    `  ${type}: { ${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(", ")} }`
  )
  .join("\n")}

RULES:
1. Only use block types listed above. Do not invent new types.
2. All field values must match the specified type/enum.
3. data agent feeds cross-asset signals to alpha; alpha and news emit signals; manager listens via mgr_on_signal.
4. risk blocks always apply regardless of other agents.
5. Each agent array can have 0–5 blocks. Only include relevant blocks.
6. If the description doesn't mention news/sentiment, leave news array empty.
7. If the description mentions macro data (NASDAQ, FX, rates, gold, VIX), populate the data array.
8. If the description hints at AI/autonomous decision, use alpha_ai_decide or news_semantic_filter.

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
{
  "name": "Short strategy name (max 5 words)",
  "description": "One sentence summary",
  "agents": {
    "data":    [],
    "alpha":   [{ "type": "...", "fields": { ... } }],
    "news":    [],
    "manager": [{ "type": "...", "fields": { ... } }],
    "risk":    [{ "type": "...", "fields": { ... } }]
  }
}`;

// ─── Response Validator ───────────────────────────────────────────────────────

export function validateStrategyResult(raw: unknown): StrategyGenerationResult {
  if (typeof raw !== "object" || raw === null) throw new Error("not an object");

  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== "string") throw new Error("missing name");
  if (typeof obj.description !== "string") throw new Error("missing description");
  if (typeof obj.agents !== "object" || obj.agents === null) throw new Error("missing agents");

  const agents = obj.agents as Record<string, unknown>;
  const validAgents: StrategyGenerationResult["agents"] = {
    data:    validateBlockArray(agents.data,    "data"),
    alpha:   validateBlockArray(agents.alpha,   "alpha"),
    news:    validateBlockArray(agents.news,    "news"),
    manager: validateBlockArray(agents.manager, "manager"),
    risk:    validateBlockArray(agents.risk,    "risk"),
  };

  return { name: obj.name, description: obj.description, agents: validAgents };
}

function validateBlockArray(raw: unknown, agentKey: string): StrategyBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b): b is StrategyBlock => {
      if (typeof b !== "object" || b === null) return false;
      const block = b as Record<string, unknown>;
      if (typeof block.type !== "string") return false;
      if (!(block.type in BLOCK_TYPES)) {
        console.warn(`[strategy] unknown block type "${block.type}" in agent "${agentKey}" — skipped`);
        return false;
      }
      if (typeof block.fields !== "object" || block.fields === null) return false;
      return true;
    })
    .slice(0, 5); // max 5 blocks per agent
}
