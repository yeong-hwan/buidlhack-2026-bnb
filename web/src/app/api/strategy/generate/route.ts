import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, validateStrategyResult, type StrategyGenerationResult } from "@/lib/strategySchema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  let rawText: string;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    });
    rawText = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown API error";
    console.error("[strategy/generate] Anthropic API error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Strip potential markdown code fences
  const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { error: "LLM returned invalid JSON", raw: rawText },
      { status: 502 }
    );
  }

  let result: StrategyGenerationResult;
  try {
    result = validateStrategyResult(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: `Schema validation failed: ${(e as Error).message}`, raw: parsed },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
