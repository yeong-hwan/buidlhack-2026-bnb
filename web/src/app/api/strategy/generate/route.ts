import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  validateStrategyResult,
  type StrategyGenerationResult,
  type StrategyBlock,
} from "@/lib/strategySchema";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Smart Mock ───────────────────────────────────────────────────────────────

function has(lower: string, ...words: string[]): boolean {
  return words.some((w) => lower.includes(w));
}

function hasKorean(text: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
}

function generateMockStrategy(input: string, previousStrategy?: StrategyGenerationResult): StrategyGenerationResult {
  const lower = input.toLowerCase();

  // If there is a previous strategy and the input looks like a modification request,
  // start from the existing blocks and apply only the changed parameters.
  if (previousStrategy) {
    const isModification =
      has(lower, "stop loss", "stop-loss", "손절", "스탑로스") ||
      has(lower, "take profit", "익절", "테이크프로핏") ||
      has(lower, "change", "modify", "update", "set", "바꿔", "변경", "수정", "줄여", "늘려", "높여", "낮춰");

    if (isModification) {
      // Deep-clone previous strategy agents
      const agents: StrategyGenerationResult["agents"] = {
        data:    previousStrategy.agents.data.map(b => ({ ...b, fields: { ...b.fields } })),
        alpha:   previousStrategy.agents.alpha.map(b => ({ ...b, fields: { ...b.fields } })),
        news:    previousStrategy.agents.news.map(b => ({ ...b, fields: { ...b.fields } })),
        manager: previousStrategy.agents.manager.map(b => ({ ...b, fields: { ...b.fields } })),
        risk:    previousStrategy.agents.risk.map(b => ({ ...b, fields: { ...b.fields } })),
      };

      // Apply stop loss modification
      if (has(lower, "stop loss", "stop-loss", "손절", "스탑로스")) {
        const pctMatch = input.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          const slBlock = agents.risk.find(b => b.type === "risk_set_stop_loss");
          if (slBlock) {
            slBlock.fields = { ...slBlock.fields, PCT: pct };
          } else {
            agents.risk.unshift({ type: "risk_set_stop_loss", fields: { PCT: pct } });
          }
        }
      }

      // Apply take profit modification
      if (has(lower, "take profit", "익절", "테이크프로핏")) {
        const pctMatch = input.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          const tpBlock = agents.risk.find(b => b.type === "risk_set_take_profit");
          if (tpBlock) {
            tpBlock.fields = { ...tpBlock.fields, PCT: pct };
          } else {
            agents.risk.push({ type: "risk_set_take_profit", fields: { PCT: pct } });
          }
        }
      }

      const isKorean = hasKorean(input);
      const description = isKorean
        ? `기존 전략에서 요청하신 항목을 수정했습니다: ${input.trim()}`
        : `Modified the existing strategy as requested: ${input.trim()}`;

      return validateStrategyResult({
        name: previousStrategy.name,
        description,
        agents,
      });
    }
  }

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
  // Always emit data signal when data feeds are present
  if (data.length > 0 && !data.some((b) => b.type === "feed_emit")) {
    data.push({ type: "feed_emit", fields: { SIGNAL: data.some((b) => b.type === "feed_fear_greed") ? "RISK_OFF" : "RISK_ON" } });
  }

  // ── Alpha layer ─────────────────────────────────────────────────────────────
  const isAggressive = has(lower, "aggressive", "공격적");
  const isConservative = has(lower, "conservative", "안전", "보수적");
  const isScalping = has(lower, "scalp", "scalping", "스캘핑", "단타");
  const isSwing = has(lower, "swing", "스윙");

  if (has(lower, "autonomous", "ai decide", "ai signal", "let ai", "ai judge", "ai trading")) {
    alpha.push({ type: "alpha_ai_decide", fields: { CONTEXT: "all_data", CONFIDENCE: isAggressive ? 60 : 75 } });
    alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: isAggressive ? 90 : 80 } });
  } else if (isScalping) {
    alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 1 } });
    alpha.push({ type: "alpha_when_volume", fields: { MULTIPLIER: 3 } });
    alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: 85 } });
  } else if (isSwing) {
    const period = has(lower, "30") ? 30 : has(lower, "21") ? 21 : 14;
    alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: period } });
    alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: 70 } });
  } else if (has(lower, "momentum", "trend", "breakout", "pump", "bullish run")) {
    const period = isAggressive ? 7 : isConservative ? 21 : 14;
    alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: period } });
  } else if (has(lower, "price", "price above", "price over", "hit", "reach", "target")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const value = has(lower, "eth") ? 3000 : has(lower, "btc") ? 60000 : 300;
    alpha.push({ type: "alpha_when_price", fields: { TOKEN: token, OPERATOR: ">=", VALUE: value } });
  } else if (has(lower, "volume", "spike", "surge")) {
    alpha.push({ type: "alpha_when_volume", fields: { MULTIPLIER: isAggressive ? 1.5 : 2 } });
  } else if (!has(lower, "rebalance", "portfolio ratio")) {
    // Default: momentum signal
    alpha.push({ type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 7 } });
  }

  // Always add emit signal if alpha has triggers but no emit
  if (alpha.length > 0 && !alpha.some((b) => b.type === "alpha_emit_signal")) {
    alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: isAggressive ? 85 : isConservative ? 65 : 75 } });
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
    manager.push({ type: "mgr_buy", fields: { AMOUNT: isAggressive ? 200 : 100, TOKEN: "BNB", DEX: "pancake" } });
    manager.push({ type: "mgr_sell", fields: { AMOUNT_PCT: 50, TOKEN: "BNB" } });
  } else if (isScalping) {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    manager.push({ type: "mgr_buy", fields: { AMOUNT: 50, TOKEN: "BNB", DEX: "pancake" } });
    manager.push({ type: "mgr_repeat", fields: { N: 1, UNIT: "hours" } });
  } else if (has(lower, "dca", "dollar cost", "accumulate", "buy regularly", "every week", "weekly", "every month", "monthly")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const interval = has(lower, "daily", "every day") ? "daily" : has(lower, "monthly", "every month") ? "monthly" : "weekly";
    const amount = has(lower, "500") ? 500 : has(lower, "200") ? 200 : has(lower, "50") ? 50 : 100;
    manager.push({ type: "mgr_dca", fields: { AMOUNT: amount, TOKEN: token, INTERVAL: interval } });
    manager.push({ type: "mgr_repeat", fields: { N: 1, UNIT: interval === "daily" ? "days" : "weeks" } });
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
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const amount = isAggressive ? 200 : isConservative ? 50 : 100;
    manager.push({ type: "mgr_buy", fields: { AMOUNT: amount, TOKEN: token, DEX: "pancake" } });
  }

  // ── Risk layer ───────────────────────────────────────────────────────────────
  if (has(lower, "stop loss", "stop-loss", "cut loss", "손절")) {
    const pctMatch = input.match(/(\d+(?:\.\d+)?)\s*%/);
    const pct = pctMatch ? parseFloat(pctMatch[1]) :
      isAggressive ? 5 : isConservative ? 15 : isScalping ? 2 : 10;
    risk.push({ type: "risk_set_stop_loss", fields: { PCT: pct } });
  } else {
    // Always add a default stop loss; adjust by style
    const pct = isAggressive ? 5 : isConservative ? 15 : isScalping ? 2 : 10;
    risk.push({ type: "risk_set_stop_loss", fields: { PCT: pct } });
  }

  if (has(lower, "take profit", "profit target", "tp", "target", "익절")) {
    const pctMatch = input.match(/(\d+(?:\.\d+)?)\s*%/);
    const pct = pctMatch ? parseFloat(pctMatch[1]) :
      isAggressive ? 50 : isConservative ? 15 : isScalping ? 5 : 20;
    risk.push({ type: "risk_set_take_profit", fields: { PCT: pct } });
  } else {
    // Always add take profit; adjust by style
    const pct = isAggressive ? 50 : isConservative ? 15 : isScalping ? 5 : 25;
    risk.push({ type: "risk_set_take_profit", fields: { PCT: pct } });
  }

  if (isConservative || has(lower, "drawdown", "max loss", "risk limit", "portfolio loss", "rebalance", "autonomous")) {
    const pct = isConservative ? 10 : has(lower, "30%", "30 percent") ? 30 : has(lower, "10%", "10 percent") ? 10 : 20;
    risk.push({ type: "risk_max_drawdown", fields: { PCT: pct } });
  }

  if (has(lower, "max position", "position limit", "exposure", "cap")) {
    risk.push({ type: "risk_max_position", fields: { MAX_USDT: isAggressive ? 1000 : 500 } });
  } else if (isConservative || has(lower, "rebalance", "autonomous")) {
    risk.push({ type: "risk_max_position", fields: { MAX_USDT: isConservative ? 300 : 1000 } });
  }

  if (has(lower, "daily limit", "daily loss", "loss cap") || isConservative) {
    risk.push({ type: "risk_daily_loss_limit", fields: { LIMIT_USDT: isConservative ? 50 : 100 } });
  }

  // ── Name generation ──────────────────────────────────────────────────────────
  let name = "Custom Trading Strategy";
  if (has(lower, "autonomous", "ai trading", "fully automated")) {
    name = "Autonomous AI Strategy";
  } else if (isScalping) {
    name = "Scalping Strategy";
  } else if (isSwing) {
    name = "Swing Trading Strategy";
  } else if (isAggressive) {
    name = "Aggressive Momentum Strategy";
  } else if (isConservative) {
    name = "Conservative Safe Strategy";
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

  // ── Build conversational description (Korean if input contains Korean) ───────
  const isKorean = hasKorean(input);
  const parts: string[] = [];

  if (isKorean) {
    if (data.length > 0) {
      const feeds = data.filter((b) => b.type !== "feed_emit").map((b) => {
        const labels: Record<string, string> = { feed_nasdaq: "나스닥 선물", feed_interest_rate: "연준 금리", feed_fx_rate: "환율", feed_commodity: "원자재 가격", feed_fear_greed: "공포탐욕 지수", feed_vix: "VIX 변동성" };
        return labels[b.type] ?? b.type;
      });
      if (feeds.length > 0) parts.push(`${feeds.join(", ")} 등 매크로 데이터를 모니터링합니다.`);
    }
    if (alpha.length > 0) {
      const hasAI = alpha.some((b) => b.type === "alpha_ai_decide");
      if (hasAI) {
        parts.push("AI 에이전트가 시장 상황을 자율 분석하여 트레이딩 시그널을 생성합니다.");
      } else {
        const triggers = alpha.filter((b) => b.type.startsWith("alpha_when_")).map((b) => {
          if (b.type === "alpha_when_momentum") return `${b.fields.PERIOD}일 모멘텀`;
          if (b.type === "alpha_when_price") return `${b.fields.TOKEN} 가격 ${b.fields.OPERATOR} ${b.fields.VALUE}`;
          if (b.type === "alpha_when_volume") return `거래량 급등 (${b.fields.MULTIPLIER}배)`;
          return b.type;
        });
        if (triggers.length > 0) parts.push(`${triggers.join(", ")} 시그널 기반으로 매매 조건을 감지합니다.`);
      }
    }
    if (news.length > 0) {
      const hasSemantic = news.some((b) => b.type === "news_semantic_filter");
      if (hasSemantic) parts.push("AI 시맨틱 필터로 뉴스 맥락과 감성을 분석합니다.");
      else parts.push("뉴스 감성을 모니터링하여 매매 시그널을 생성합니다.");
    }
    if (manager.length > 0) {
      const actions = manager.filter((b) => !b.type.includes("signal") && b.type !== "mgr_repeat").map((b) => {
        if (b.type === "mgr_buy") return `${b.fields.TOKEN} ${b.fields.AMOUNT} USDT 매수 (${b.fields.DEX === "pancake" ? "PancakeSwap" : "시장가"})`;
        if (b.type === "mgr_sell") return `${b.fields.TOKEN} ${b.fields.AMOUNT_PCT}% 매도`;
        if (b.type === "mgr_dca") return `${b.fields.TOKEN} ${b.fields.INTERVAL} DCA ${b.fields.AMOUNT} USDT`;
        if (b.type === "mgr_rebalance") return `${b.fields.TOKEN} ${b.fields.TARGET_PCT}% 비중 리밸런싱`;
        return b.type;
      });
      if (actions.length > 0) parts.push(`실행: ${actions.join(", ")}.`);
    }
    if (risk.length > 0) {
      const guards = risk.map((b) => {
        if (b.type === "risk_set_stop_loss") return `손절 -${b.fields.PCT}%`;
        if (b.type === "risk_set_take_profit") return `익절 +${b.fields.PCT}%`;
        if (b.type === "risk_max_position") return `최대 포지션 ${b.fields.MAX_USDT} USDT`;
        if (b.type === "risk_max_drawdown") return `최대 낙폭 ${b.fields.PCT}%`;
        if (b.type === "risk_daily_loss_limit") return `일일 손실 한도 ${b.fields.LIMIT_USDT} USDT`;
        return b.type;
      });
      parts.push(`리스크 관리: ${guards.join(", ")}.`);
    }
  } else {
    if (data.length > 0) {
      const feeds = data.filter((b) => b.type !== "feed_emit").map((b) => {
        const labels: Record<string, string> = { feed_nasdaq: "NASDAQ futures", feed_interest_rate: "Fed interest rate", feed_fx_rate: "FX rate", feed_commodity: "commodity prices", feed_fear_greed: "Fear & Greed index", feed_vix: "VIX volatility" };
        return labels[b.type] ?? b.type;
      });
      if (feeds.length > 0) parts.push(`Monitoring ${feeds.join(", ")} as macro data feeds.`);
    }
    if (alpha.length > 0) {
      const hasAI = alpha.some((b) => b.type === "alpha_ai_decide");
      if (hasAI) {
        parts.push("AI agent will autonomously analyze market conditions and emit trading signals.");
      } else {
        const triggers = alpha.filter((b) => b.type.startsWith("alpha_when_")).map((b) => {
          if (b.type === "alpha_when_momentum") return `${b.fields.PERIOD}-day momentum`;
          if (b.type === "alpha_when_price") return `${b.fields.TOKEN} price ${b.fields.OPERATOR} ${b.fields.VALUE}`;
          if (b.type === "alpha_when_volume") return `volume spike (${b.fields.MULTIPLIER}x avg)`;
          return b.type;
        });
        if (triggers.length > 0) parts.push(`Alpha signals based on ${triggers.join(" and ")}.`);
      }
    }
    if (news.length > 0) {
      const hasSemantic = news.some((b) => b.type === "news_semantic_filter");
      if (hasSemantic) parts.push("Using AI semantic filter to analyze news context and sentiment.");
      else parts.push("Monitoring crypto news sentiment for trading signals.");
    }
    if (manager.length > 0) {
      const actions = manager.filter((b) => !b.type.includes("signal") && b.type !== "mgr_repeat").map((b) => {
        if (b.type === "mgr_buy") return `buy ${b.fields.AMOUNT} USDT of ${b.fields.TOKEN} via ${b.fields.DEX === "pancake" ? "PancakeSwap" : "market order"}`;
        if (b.type === "mgr_sell") return `sell ${b.fields.AMOUNT_PCT}% of ${b.fields.TOKEN}`;
        if (b.type === "mgr_dca") return `DCA ${b.fields.AMOUNT} USDT into ${b.fields.TOKEN} ${b.fields.INTERVAL}`;
        if (b.type === "mgr_rebalance") return `rebalance ${b.fields.TOKEN} to ${b.fields.TARGET_PCT}%`;
        return b.type;
      });
      if (actions.length > 0) parts.push(`Execution: ${actions.join(", ")}.`);
    }
    if (risk.length > 0) {
      const guards = risk.map((b) => {
        if (b.type === "risk_set_stop_loss") return `stop loss at -${b.fields.PCT}%`;
        if (b.type === "risk_set_take_profit") return `take profit at +${b.fields.PCT}%`;
        if (b.type === "risk_max_position") return `max position ${b.fields.MAX_USDT} USDT`;
        if (b.type === "risk_max_drawdown") return `max drawdown ${b.fields.PCT}%`;
        if (b.type === "risk_daily_loss_limit") return `daily loss cap ${b.fields.LIMIT_USDT} USDT`;
        return b.type;
      });
      parts.push(`Risk guards: ${guards.join(", ")}.`);
    }
  }

  const description = parts.length > 0
    ? parts.join(" ")
    : "Strategy configured with default settings.";

  return validateStrategyResult({ name, description, agents: { data, alpha, news, manager, risk } });
}

// ─── Shared LLM response parser ──────────────────────────────────────────────

function parseLlmResponse(rawText: string, input: string): StrategyGenerationResult | null {
  const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonText);
    return validateStrategyResult(parsed);
  } catch (e) {
    console.warn("[strategy/generate] LLM parse/validate failed:", (e as Error).message);
    return null;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { input, previousStrategy } = await req.json();

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  // Build context-aware user message
  const userMessage = previousStrategy
    ? `CURRENT STRATEGY (modify this based on the user request below):\n${JSON.stringify(previousStrategy, null, 2)}\n\nUSER REQUEST:\n${input}`
    : input;

  // 1. Try OpenAI first
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
      });
      const rawText = completion.choices[0]?.message?.content ?? "";
      const result = parseLlmResponse(rawText, input);
      if (result) return NextResponse.json(result);
    } catch (err: unknown) {
      console.warn("[strategy/generate] OpenAI error:", err instanceof Error ? err.message : err);
    }
  }

  // 2. Try Anthropic
  if (anthropic) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const rawText = message.content[0].type === "text" ? message.content[0].text : "";
      const result = parseLlmResponse(rawText, input);
      if (result) return NextResponse.json(result);
    } catch (err: unknown) {
      console.warn("[strategy/generate] Anthropic error:", err instanceof Error ? err.message : err);
    }
  }

  // 3. Smart mock fallback
  return NextResponse.json(generateMockStrategy(input, previousStrategy));
}
