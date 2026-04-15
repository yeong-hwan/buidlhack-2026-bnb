/**
 * Strategy Generation Protocol
 *
 * Input  → natural language strategy description
 * Output → StrategyGenerationResult (strict JSON)
 */

// ─── Output Schema ────────────────────────────────────────────────────────────

export interface StrategyBlock {
  type: BlockType;
  fields: Record<string, string | number>;
  children?: StrategyBlock[];
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
  // Data Feed — emit RISK_ON / RISK_OFF / NEUTRAL
  feed_price:       { TOKEN: "BNB|ETH|BTC", OPERATOR: ">=|<=|>|<", VALUE: "number" },
  feed_change_pct:  { TOKEN: "BNB|ETH|BTC", DIRECTION: "up|down", PCT: "number", PERIOD: "1h|4h|24h|7d" },
  feed_vix:         { OPERATOR: ">=|<=", THRESHOLD: "number" },
  feed_emit:        { SIGNAL: "RISK_ON|RISK_OFF|NEUTRAL" },

  // Alpha Agent — emit BUY / SELL / HOLD
  alpha_when_price:  { TOKEN: "BNB|ETH|BTC", OPERATOR: ">=|<=|>|<", VALUE: "number" },
  alpha_when_volume: { MULTIPLIER: "number" },
  alpha_rsi:         { TOKEN: "BNB|ETH|BTC", CONDITION: "oversold|overbought", THRESHOLD: "number" },
  alpha_ma_cross:    { TOKEN: "BNB|ETH|BTC", CROSS: "golden|death", SHORT: "number", LONG: "number" },
  alpha_emit_signal: { SIGNAL: "BUY|SELL|HOLD", STRENGTH: "number(1-100)" },

  // News Agent — emit BULLISH / BEARISH / NEUTRAL
  news_when_keyword:   { KEYWORD: "string", SOURCE: "news|twitter|reddit" },
  news_when_sentiment: { SENTIMENT: "positive|negative|neutral" },
  news_emit_signal:    { SIGNAL: "BULLISH|BEARISH|NEUTRAL" },

  // Manager — execute on-chain orders
  mgr_on_signal: { SIGNAL: "BUY|SELL|BULLISH|BEARISH" },
  mgr_buy:       { AMOUNT: "number", TOKEN: "BNB|ETH|BTC", DEX: "pancake|market" },
  mgr_sell:      { AMOUNT_PCT: "number(1-100)", TOKEN: "BNB|ETH|BTC" },
  mgr_repeat:    { N: "number", UNIT: "hours|days|weeks" },
  mgr_if_signal: { SIGNAL: "BUY|SELL|HOLD|BULLISH|BEARISH" },

  // Risk Agent — always-on guardrails
  risk_set_stop_loss:   { PCT: "number(0.1-99)" },
  risk_set_take_profit: { PCT: "number(0.1-1000)" },
  risk_max_position:    { MAX_USDT: "number" },
  risk_if_drawdown:     { PCT: "number(1-100)" },
  risk_cooldown:        { N: "number", UNIT: "hours|days" },
} as const;

export type BlockType = keyof typeof BLOCK_TYPES;

// ─── Prompt Harness ───────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a strategy compiler for an on-chain trading agent platform.

Convert a natural language strategy description into a JSON object with blocks for 5 agent layers:

- data:    Market data triggers (price, % change, VIX). Emits RISK_ON / RISK_OFF / NEUTRAL.
- alpha:   Crypto signal detection (price, volume, RSI, MA cross). Emits BUY / SELL / HOLD.
- news:    News/social sentiment (keywords, sentiment). Emits BULLISH / BEARISH / NEUTRAL.
- manager: Executes on-chain orders based on received signals.
- risk:    Always-on guardrails (stop loss, take profit, drawdown, cooldown).

VALID BLOCK TYPES AND FIELDS:
${Object.entries(BLOCK_TYPES)
  .map(([type, fields]) =>
    `  ${type}: { ${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(", ")} }`
  )
  .join("\n")}

RULES:
1. Only use block types listed above. Never invent new types.
2. All field values must match the specified enum/type.
3. Data flow: data → alpha, alpha → manager, news → manager, manager → risk.
4. data MUST end with feed_emit. alpha MUST end with alpha_emit_signal. news MUST end with news_emit_signal.
5. manager MUST start with mgr_on_signal or mgr_if_signal.
6. risk MUST always have stop_loss + take_profit. Never leave risk empty.
7. Generate 2–4 blocks per active agent.
8. Only include news blocks if the description mentions news/sentiment/social.
9. Only include data blocks if the description mentions macro signals (price change, VIX, volatility).
10. mgr_if_signal and mgr_repeat are C-BLOCKs — their "children" array holds nested action blocks.
11. risk_if_drawdown is a C-BLOCK — its "children" array holds protective action blocks.
12. Respond in the same language as the user for the "description" field.
13. Block order within each agent: trigger/condition blocks first, actions in the middle, emit last.
14. MODIFICATION: When user sends a modification request, only change the specified part, keep everything else.
15. CURRENT STRATEGY: If provided, use it as the base and apply only the requested changes.

EXAMPLE — RSA oversold + MA golden cross BNB strategy:
Input: "Buy BNB when RSI is oversold and MA golden cross, stop loss 8%"
Output:
{
  "name": "RSI + MA BNB Strategy",
  "description": "BNB의 RSI 과매도 + 골든크로스가 동시에 감지되면 매수합니다. 손절 8%, 익절 20%로 리스크를 관리합니다.",
  "agents": {
    "data": [],
    "alpha": [
      {"type":"alpha_rsi","fields":{"TOKEN":"BNB","CONDITION":"oversold","THRESHOLD":30}},
      {"type":"alpha_ma_cross","fields":{"TOKEN":"BNB","CROSS":"golden","SHORT":7,"LONG":25}},
      {"type":"alpha_emit_signal","fields":{"SIGNAL":"BUY","STRENGTH":85}}
    ],
    "news": [],
    "manager": [
      {"type":"mgr_on_signal","fields":{"SIGNAL":"BUY"}},
      {"type":"mgr_buy","fields":{"AMOUNT":100,"TOKEN":"BNB","DEX":"pancake"}}
    ],
    "risk": [
      {"type":"risk_set_stop_loss","fields":{"PCT":8}},
      {"type":"risk_set_take_profit","fields":{"PCT":20}},
      {"type":"risk_max_position","fields":{"MAX_USDT":500}}
    ]
  }
}

EXAMPLE — Signal-based branching with cooldown:
Input: "If BUY signal buy BNB, if SELL signal sell, add cooldown 24h after drawdown"
Output:
{
  "name": "Signal Branch Strategy",
  "description": "매수 신호 시 BNB를 매수하고 매도 신호 시 즉시 청산합니다. 낙폭이 15% 초과 시 24시간 쿨다운을 적용합니다.",
  "agents": {
    "data": [],
    "alpha": [
      {"type":"alpha_when_price","fields":{"TOKEN":"BNB","OPERATOR":">=","VALUE":300}},
      {"type":"alpha_emit_signal","fields":{"SIGNAL":"BUY","STRENGTH":75}}
    ],
    "news": [],
    "manager": [
      {"type":"mgr_on_signal","fields":{"SIGNAL":"BUY"}},
      {"type":"mgr_if_signal","fields":{"SIGNAL":"BUY"},"children":[
        {"type":"mgr_buy","fields":{"AMOUNT":100,"TOKEN":"BNB","DEX":"pancake"}}
      ]},
      {"type":"mgr_if_signal","fields":{"SIGNAL":"SELL"},"children":[
        {"type":"mgr_sell","fields":{"AMOUNT_PCT":100,"TOKEN":"BNB"}}
      ]}
    ],
    "risk": [
      {"type":"risk_set_stop_loss","fields":{"PCT":8}},
      {"type":"risk_set_take_profit","fields":{"PCT":20}},
      {"type":"risk_if_drawdown","fields":{"PCT":15},"children":[
        {"type":"risk_cooldown","fields":{"N":24,"UNIT":"hours"}}
      ]}
    ]
  }
}

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
{
  "name": "Short strategy name (max 5 words)",
  "description": "2-3 sentence conversational explanation",
  "agents": {
    "data":    [],
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
  if (type.includes("when_") || type === "mgr_on_signal" || type === "feed_price" || type === "feed_change_pct" || type === "feed_vix" || type === "alpha_rsi" || type === "alpha_ma_cross") return 0;
  if (type.endsWith("_emit") || type.endsWith("_emit_signal")) return 2;
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
    .slice(0, 6);
}
