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

  // Modification mode — apply only changed params to existing strategy
  if (previousStrategy) {
    const isModification =
      has(lower, "stop loss", "stop-loss", "손절", "스탑로스") ||
      has(lower, "take profit", "익절", "테이크프로핏") ||
      has(lower, "change", "modify", "update", "set", "바꿔", "변경", "수정", "줄여", "늘려", "높여", "낮춰");

    if (isModification) {
      const agents: StrategyGenerationResult["agents"] = {
        data:    previousStrategy.agents.data.map(b => ({ ...b, fields: { ...b.fields } })),
        alpha:   previousStrategy.agents.alpha.map(b => ({ ...b, fields: { ...b.fields } })),
        news:    previousStrategy.agents.news.map(b => ({ ...b, fields: { ...b.fields } })),
        manager: previousStrategy.agents.manager.map(b => ({ ...b, fields: { ...b.fields } })),
        risk:    previousStrategy.agents.risk.map(b => ({ ...b, fields: { ...b.fields } })),
      };

      if (has(lower, "stop loss", "stop-loss", "손절", "스탑로스")) {
        const pctMatch = input.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          const slBlock = agents.risk.find(b => b.type === "risk_set_stop_loss");
          if (slBlock) slBlock.fields = { ...slBlock.fields, PCT: pct };
          else agents.risk.unshift({ type: "risk_set_stop_loss", fields: { PCT: pct } });
        }
      }

      if (has(lower, "take profit", "익절", "테이크프로핏")) {
        const pctMatch = input.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          const tpBlock = agents.risk.find(b => b.type === "risk_set_take_profit");
          if (tpBlock) tpBlock.fields = { ...tpBlock.fields, PCT: pct };
          else agents.risk.push({ type: "risk_set_take_profit", fields: { PCT: pct } });
        }
      }

      const isKorean = hasKorean(input);
      return validateStrategyResult({
        name: previousStrategy.name,
        description: isKorean
          ? `기존 전략에서 요청하신 항목을 수정했습니다: ${input.trim()}`
          : `Modified the existing strategy: ${input.trim()}`,
        agents,
      });
    }
  }

  const data: StrategyBlock[] = [];
  const alpha: StrategyBlock[] = [];
  const news: StrategyBlock[] = [];
  const manager: StrategyBlock[] = [];
  const risk: StrategyBlock[] = [];

  const isAggressive  = has(lower, "aggressive", "공격적");
  const isConservative = has(lower, "conservative", "안전", "보수적");
  const isScalping    = has(lower, "scalp", "scalping", "스캘핑", "단타");
  const isSwing       = has(lower, "swing", "스윙");
  const isKorean      = hasKorean(input);

  // ── Data layer ─────────────────────────────────────────────────────────────
  if (has(lower, "vix", "volatility", "implied vol", "변동성")) {
    data.push({ type: "feed_vix", fields: { OPERATOR: ">=", THRESHOLD: 25 } });
  }
  if (has(lower, "price change", "% change", "pump", "dump", "급등", "급락", "percent")) {
    const token = has(lower, "eth") ? "ETH" : has(lower, "btc") ? "BTC" : "BNB";
    const direction = has(lower, "dump", "down", "급락", "하락") ? "down" : "up";
    data.push({ type: "feed_change_pct", fields: { TOKEN: token, DIRECTION: direction, PCT: 5, PERIOD: "24h" } });
  }
  if (data.length > 0) {
    data.push({ type: "feed_emit", fields: { SIGNAL: "RISK_ON" } });
  }

  // ── Alpha layer ─────────────────────────────────────────────────────────────
  const token = has(lower, "eth", "ethereum") ? "ETH" : has(lower, "btc", "bitcoin") ? "BTC" : "BNB";

  if (has(lower, "rsi", "oversold", "overbought", "과매도", "과매수")) {
    const condition = has(lower, "overbought", "과매수") ? "overbought" : "oversold";
    const threshold = condition === "overbought" ? 70 : 30;
    alpha.push({ type: "alpha_rsi", fields: { TOKEN: token, CONDITION: condition, THRESHOLD: threshold } });
  } else if (has(lower, "ma", "moving average", "golden cross", "death cross", "이동평균", "골든", "데드")) {
    const cross = has(lower, "death", "bearish", "데드") ? "death" : "golden";
    alpha.push({ type: "alpha_ma_cross", fields: { TOKEN: token, CROSS: cross, SHORT: 7, LONG: 25 } });
  } else if (has(lower, "volume", "거래량", "surge", "spike")) {
    alpha.push({ type: "alpha_when_volume", fields: { MULTIPLIER: isAggressive ? 1.5 : 2 } });
  } else if (has(lower, "price", "가격", "target", "above", "below", "돌파", "이탈")) {
    const value = token === "ETH" ? 3000 : token === "BTC" ? 60000 : 300;
    alpha.push({ type: "alpha_when_price", fields: { TOKEN: token, OPERATOR: ">=", VALUE: value } });
  } else if (isScalping) {
    alpha.push({ type: "alpha_when_volume", fields: { MULTIPLIER: 3 } });
    alpha.push({ type: "alpha_when_price", fields: { TOKEN: token, OPERATOR: ">=", VALUE: 300 } });
  } else if (isSwing) {
    alpha.push({ type: "alpha_ma_cross", fields: { TOKEN: token, CROSS: "golden", SHORT: 7, LONG: 25 } });
  } else {
    // Default: RSI oversold entry
    alpha.push({ type: "alpha_rsi", fields: { TOKEN: token, CONDITION: "oversold", THRESHOLD: 30 } });
  }

  if (alpha.length > 0 && !alpha.some(b => b.type === "alpha_emit_signal")) {
    alpha.push({ type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: isAggressive ? 85 : isConservative ? 65 : 75 } });
  }

  // ── News layer ──────────────────────────────────────────────────────────────
  if (has(lower, "news", "sentiment", "뉴스", "감성", "공포", "분위기")) {
    const sentiment = has(lower, "bearish", "negative", "부정", "하락") ? "negative" : "positive";
    news.push({ type: "news_when_sentiment", fields: { SENTIMENT: sentiment } });
    news.push({ type: "news_emit_signal", fields: { SIGNAL: sentiment === "positive" ? "BULLISH" : "BEARISH" } });
  } else if (has(lower, "announcement", "listing", "upgrade", "keyword", "이벤트", "공시", "상장")) {
    news.push({ type: "news_when_keyword", fields: { KEYWORD: "BNB upgrade", SOURCE: "news" } });
    news.push({ type: "news_emit_signal", fields: { SIGNAL: "BULLISH" } });
  }

  // ── Manager layer ───────────────────────────────────────────────────────────
  if (has(lower, "repeat", "every", "periodic", "주기", "매일", "매주", "daily", "weekly")) {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    const unit = has(lower, "hour", "시간") ? "hours" : has(lower, "week", "주") ? "weeks" : "days";
    const n = has(lower, "7") ? 7 : 1;
    const amount = isAggressive ? 200 : isConservative ? 50 : 100;
    manager.push({ type: "mgr_repeat", fields: { N: n, UNIT: unit }, children: [
      { type: "mgr_buy", fields: { AMOUNT: amount, TOKEN: token, DEX: "pancake" } },
    ]});
  } else if (has(lower, "branch", "if buy", "if sell", "분기", "조건부")) {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    manager.push({ type: "mgr_if_signal", fields: { SIGNAL: "BUY" }, children: [
      { type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: token, DEX: "pancake" } },
    ]});
    manager.push({ type: "mgr_if_signal", fields: { SIGNAL: "SELL" }, children: [
      { type: "mgr_sell", fields: { AMOUNT_PCT: 100, TOKEN: token } },
    ]});
  } else if (has(lower, "sell", "exit", "close", "청산", "매도")) {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "SELL" } });
    manager.push({ type: "mgr_sell", fields: { AMOUNT_PCT: 100, TOKEN: token } });
  } else {
    manager.push({ type: "mgr_on_signal", fields: { SIGNAL: "BUY" } });
    const amount = isAggressive ? 200 : isConservative ? 50 : 100;
    manager.push({ type: "mgr_buy", fields: { AMOUNT: amount, TOKEN: token, DEX: "pancake" } });
  }

  // ── Risk layer ──────────────────────────────────────────────────────────────
  const slPct = (() => {
    const m = input.match(/(?:stop.*?|손절.*?)(\d+(?:\.\d+)?)\s*%/i);
    if (m) return parseFloat(m[1]);
    return isScalping ? 2 : isAggressive ? 5 : isConservative ? 15 : 10;
  })();
  risk.push({ type: "risk_set_stop_loss", fields: { PCT: slPct } });

  const tpPct = (() => {
    const m = input.match(/(?:take profit.*?|익절.*?)(\d+(?:\.\d+)?)\s*%/i);
    if (m) return parseFloat(m[1]);
    return isScalping ? 5 : isAggressive ? 50 : isConservative ? 15 : 25;
  })();
  risk.push({ type: "risk_set_take_profit", fields: { PCT: tpPct } });

  if (isConservative || has(lower, "drawdown", "낙폭", "리스크 관리", "risk limit")) {
    const ddPct = isConservative ? 10 : 20;
    risk.push({ type: "risk_if_drawdown", fields: { PCT: ddPct }, children: [
      { type: "risk_cooldown", fields: { N: 24, UNIT: "hours" } },
    ]});
  }

  if (has(lower, "max position", "position limit", "최대 포지션", "exposure") || isConservative) {
    risk.push({ type: "risk_max_position", fields: { MAX_USDT: isConservative ? 300 : isAggressive ? 1000 : 500 } });
  }

  // ── Name generation ──────────────────────────────────────────────────────────
  let name = "Custom Trading Strategy";
  if (isScalping) name = "Scalping Strategy";
  else if (isSwing) name = "Swing Trading Strategy";
  else if (isAggressive) name = "Aggressive Momentum Strategy";
  else if (isConservative) name = "Conservative Safe Strategy";
  else if (has(lower, "rsi", "oversold", "overbought")) name = `RSI ${token} Strategy`;
  else if (has(lower, "ma", "golden cross", "ma cross")) name = `MA Cross ${token} Strategy`;
  else if (has(lower, "news", "sentiment")) name = "News Sentiment Strategy";
  else if (has(lower, "volume", "거래량")) name = "Volume Spike Strategy";
  else if (has(lower, "vix", "변동성")) name = "Volatility Signal Strategy";
  else if (has(lower, "repeat", "weekly", "daily")) name = `Periodic ${token} Strategy`;

  // ── Description ──────────────────────────────────────────────────────────────
  const parts: string[] = [];
  if (isKorean) {
    if (data.length > 0) parts.push("매크로 데이터를 모니터링합니다.");
    if (alpha.some(b => b.type === "alpha_rsi")) {
      const b = alpha.find(b => b.type === "alpha_rsi")!;
      parts.push(`${b.fields.TOKEN} RSI ${b.fields.CONDITION === "oversold" ? "과매도" : "과매수"} ${b.fields.THRESHOLD} 기준으로 신호를 생성합니다.`);
    } else if (alpha.some(b => b.type === "alpha_ma_cross")) {
      const b = alpha.find(b => b.type === "alpha_ma_cross")!;
      parts.push(`${b.fields.TOKEN} MA${b.fields.SHORT}×${b.fields.LONG} ${b.fields.CROSS === "golden" ? "골든크로스" : "데드크로스"} 기반 신호입니다.`);
    }
    if (news.length > 0) parts.push("뉴스 감성을 추가 필터로 사용합니다.");
    parts.push(`리스크: 손절 -${slPct}%, 익절 +${tpPct}%.`);
  } else {
    if (data.length > 0) parts.push("Monitoring market data signals.");
    if (alpha.some(b => b.type === "alpha_rsi")) {
      const b = alpha.find(b => b.type === "alpha_rsi")!;
      parts.push(`Trading ${b.fields.TOKEN} on RSI ${b.fields.CONDITION} below ${b.fields.THRESHOLD}.`);
    } else if (alpha.some(b => b.type === "alpha_ma_cross")) {
      const b = alpha.find(b => b.type === "alpha_ma_cross")!;
      parts.push(`Entering on MA${b.fields.SHORT}×${b.fields.LONG} ${b.fields.CROSS} cross for ${b.fields.TOKEN}.`);
    }
    if (news.length > 0) parts.push("Using news sentiment as additional filter.");
    parts.push(`Risk: stop loss -${slPct}%, take profit +${tpPct}%.`);
  }

  return validateStrategyResult({
    name,
    description: parts.join(" ") || "Strategy configured with default settings.",
    agents: { data, alpha, news, manager, risk },
  });
}

// ─── Shared LLM response parser ───────────────────────────────────────────────

function parseLlmResponse(rawText: string): StrategyGenerationResult | null {
  const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    return validateStrategyResult(JSON.parse(jsonText));
  } catch (e) {
    console.warn("[strategy/generate] LLM parse failed:", (e as Error).message);
    return null;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { input, previousStrategy } = await req.json();

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const userMessage = previousStrategy
    ? `CURRENT STRATEGY (modify based on request below):\n${JSON.stringify(previousStrategy, null, 2)}\n\nUSER REQUEST:\n${input}`
    : input;

  // 1. Try OpenAI
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
      const result = parseLlmResponse(completion.choices[0]?.message?.content ?? "");
      if (result) return NextResponse.json(result);
    } catch (err) {
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
      const result = parseLlmResponse(rawText);
      if (result) return NextResponse.json(result);
    } catch (err) {
      console.warn("[strategy/generate] Anthropic error:", err instanceof Error ? err.message : err);
    }
  }

  // 3. Smart mock fallback
  return NextResponse.json(generateMockStrategy(input, previousStrategy));
}
