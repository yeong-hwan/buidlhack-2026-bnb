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
3. Data flow: data→alpha, alpha→manager, news→manager, manager→risk.
   - data agents MUST end with feed_emit to send signal downstream.
   - alpha agents MUST end with alpha_emit_signal to send signal to manager.
   - news agents MUST end with news_emit_signal to send signal to manager.
   - manager agents SHOULD start with mgr_on_signal to receive signals.
4. Generate 2–4 blocks per active agent. Build a REALISTIC pipeline, not just 1 block.
5. risk agent MUST always have 2+ blocks (e.g. stop_loss + take_profit). Never leave risk thin.
6. manager agent MUST always have 2+ blocks (signal receiver + action).
7. alpha agent MUST always have 2+ blocks (trigger + emit).
8. If description mentions news/sentiment, include 2-3 news blocks. Otherwise leave news empty.
9. If description mentions macro data (NASDAQ, FX, rates, gold, VIX), include 2-3 data blocks.
10. If description hints at AI/autonomous, use alpha_ai_decide and/or news_semantic_filter.
11. Respond in the same language as the user input for the "description" field.
12. Description should explain the strategy flow conversationally (2-3 sentences).
13. Block ordering within each agent MUST follow logical pipeline order: trigger/condition blocks first (types starting with "when_", "on_", or "if_"), then processing/action blocks in the middle, then emit/output blocks last (types ending with "_emit" or "_emit_signal"). This ensures correct visual flow in the DAG.
14. MODIFICATION RULE: When the user provides a modification request (e.g., "change stop loss to 5%"), only modify the specified parameter — keep everything else exactly the same.
15. CURRENT STRATEGY RULE: If a "CURRENT STRATEGY" section is present in the user message, treat it as the base to modify. Copy all agents and blocks from it unchanged, then apply only the changes the user explicitly requested.

EXAMPLE 1 — Macro + News momentum strategy:
Input: "Buy BNB when NASDAQ rises and news is bullish, stop loss 10%"
Output:
{
  "name": "Macro News BNB Strategy",
  "description": "NASDAQ 상승 시그널과 뉴스 긍정 시그널이 동시에 발생하면 BNB를 매수합니다. 손절은 -10%로 설정하고, 익절은 +25%로 관리합니다.",
  "agents": {
    "data": [
      {"type":"feed_nasdaq","fields":{"CONDITION":"above_ma"}},
      {"type":"feed_emit","fields":{"SIGNAL":"RISK_ON"}}
    ],
    "alpha": [
      {"type":"alpha_when_momentum","fields":{"DIRECTION":"above","PERIOD":14}},
      {"type":"alpha_emit_signal","fields":{"SIGNAL":"BUY","STRENGTH":80}}
    ],
    "news": [
      {"type":"news_when_sentiment","fields":{"SENTIMENT":"positive"}},
      {"type":"news_emit_signal","fields":{"SIGNAL":"BULLISH"}}
    ],
    "manager": [
      {"type":"mgr_on_signal","fields":{"SIGNAL":"BUY"}},
      {"type":"mgr_buy","fields":{"AMOUNT":100,"TOKEN":"BNB","DEX":"pancake"}}
    ],
    "risk": [
      {"type":"risk_set_stop_loss","fields":{"PCT":10}},
      {"type":"risk_set_take_profit","fields":{"PCT":25}},
      {"type":"risk_max_position","fields":{"MAX_USDT":500}}
    ]
  }
}

EXAMPLE 2 — Autonomous AI rebalance strategy:
Input: "Let AI decide when to rebalance my BNB/ETH portfolio, keep drawdown under 15%"
Output:
{
  "name": "AI Portfolio Rebalance",
  "description": "AI 에이전트가 시장 상황을 분석해 BNB와 ETH 비중을 자율적으로 조정합니다. 최대 낙폭 15% 이내로 리스크를 관리하며 포지션 한도를 설정합니다.",
  "agents": {
    "data": [
      {"type":"feed_vix","fields":{"OPERATOR":">=","THRESHOLD":20}},
      {"type":"feed_fear_greed","fields":{"ZONE":"fear"}},
      {"type":"feed_emit","fields":{"SIGNAL":"RISK_OFF"}}
    ],
    "alpha": [
      {"type":"alpha_ai_decide","fields":{"CONTEXT":"all_data","CONFIDENCE":70}},
      {"type":"alpha_emit_signal","fields":{"SIGNAL":"HOLD","STRENGTH":65}}
    ],
    "news": [
      {"type":"news_semantic_filter","fields":{"QUERY":"portfolio rebalance market signal","THRESHOLD":0.7}},
      {"type":"news_emit_signal","fields":{"SIGNAL":"NEUTRAL"}}
    ],
    "manager": [
      {"type":"mgr_on_signal","fields":{"SIGNAL":"BUY"}},
      {"type":"mgr_rebalance","fields":{"TOKEN":"BNB","TARGET_PCT":50}},
      {"type":"mgr_repeat","fields":{"N":7,"UNIT":"days"}}
    ],
    "risk": [
      {"type":"risk_set_stop_loss","fields":{"PCT":8}},
      {"type":"risk_max_drawdown","fields":{"PCT":15}},
      {"type":"risk_max_position","fields":{"MAX_USDT":1000}}
    ]
  }
}

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
{
  "name": "Short strategy name (max 5 words)",
  "description": "2-3 sentence conversational explanation",
  "agents": {
    "data":    [{"type":"...","fields":{...}}, ...],
    "alpha":   [{"type":"...","fields":{...}}, ...],
    "news":    [],
    "manager": [{"type":"...","fields":{...}}, ...],
    "risk":    [{"type":"...","fields":{...}}, ...]
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

function blockSortOrder(type: string): number {
  // Triggers first: types containing "when_" or "on_" (e.g. alpha_when_momentum, mgr_on_signal, news_when_sentiment)
  if (type.includes("when_") || type.includes("on_")) return 0;
  // Emit/output last: types ending with "_emit" or "_emit_signal" (e.g. feed_emit, alpha_emit_signal)
  if (type.endsWith("_emit") || type.endsWith("_emit_signal")) return 2;
  // Processing/action blocks in the middle
  return 1;
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
    .sort((a, b) => blockSortOrder(a.type) - blockSortOrder(b.type))
    .slice(0, 5); // max 5 blocks per agent
}
