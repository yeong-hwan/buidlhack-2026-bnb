"use client";

import dynamic from "next/dynamic";
import { useState, useTransition, useCallback } from "react";
import type { StrategyResponse, StrategyBlock, AgentBlocks } from "@/app/api/strategy/route";

const FlowCanvas = dynamic(() => import("@/components/FlowCanvas"), { ssr: false });

type AgentKey = keyof AgentBlocks;

const EXAMPLES = [
  "DCA into BNB every week with a 10% stop loss",
  "Buy BNB when NASDAQ rises and sentiment is bullish",
  "Monitor news sentiment and enter long on bullish signal",
  "Rebalance portfolio to 50% BNB on volume spike",
];

const LIFECYCLE = ["Design", "Backtest", "Deploy", "Observe", "Iterate", "Marketplace"];

const AGENTS = [
  { key: "data",    label: "Data Feed",   color: "text-amber-300",  border: "border-amber-400/30",  bg: "bg-amber-400/5",  dot: "bg-amber-400" },
  { key: "alpha",   label: "Alpha Agent", color: "text-cyan-300",   border: "border-cyan-400/30",   bg: "bg-cyan-400/5",   dot: "bg-cyan-400" },
  { key: "news",    label: "News Agent",  color: "text-violet-300", border: "border-violet-400/30", bg: "bg-violet-400/5", dot: "bg-violet-400" },
  { key: "manager", label: "Manager",     color: "text-emerald-300",border: "border-emerald-400/30",bg: "bg-emerald-400/5",dot: "bg-emerald-400" },
  { key: "risk",    label: "Risk Agent",  color: "text-rose-300",   border: "border-rose-400/30",   bg: "bg-rose-400/5",   dot: "bg-rose-400" },
] as const;

const DEFAULT_AGENTS: AgentBlocks = {
  data: [
    { type: "feed_fear_greed", fields: { ZONE: "extreme_fear" } },
    { type: "feed_emit",       fields: { SIGNAL: "RISK_OFF" } },
  ],
  alpha: [
    { type: "alpha_when_momentum", fields: { DIRECTION: "above", PERIOD: 7 } },
    { type: "alpha_emit_signal",   fields: { SIGNAL: "BUY", STRENGTH: 80 } },
  ],
  news: [
    { type: "news_when_sentiment",  fields: { SENTIMENT: "positive" } },
    { type: "news_semantic_filter", fields: { QUERY: "bullish market signal", THRESHOLD: 0.7 } },
    { type: "news_emit_signal",     fields: { SIGNAL: "BULLISH" } },
  ],
  manager: [
    { type: "mgr_on_signal", fields: { SIGNAL: "BUY" } },
    { type: "mgr_buy",       fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } },
  ],
  risk: [
    { type: "risk_set_stop_loss",   fields: { PCT: 10 } },
    { type: "risk_set_take_profit", fields: { PCT: 20 } },
  ],
};

export default function StrategyPage() {
  const [input, setInput]             = useState("");
  const [strategy, setStrategy]       = useState<StrategyResponse | null>(null);
  const [agentBlocks, setAgentBlocks] = useState<AgentBlocks>(DEFAULT_AGENTS);
  const [isPending, startTransition]  = useTransition();

  async function generate(text: string) {
    if (!text.trim()) return;
    startTransition(async () => {
      let data: StrategyResponse | null = null;

      const llmRes = await fetch("/api/strategy/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ input: text }),
      });

      if (llmRes.ok) {
        data = await llmRes.json();
      } else {
        const fallback = await fetch("/api/strategy", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ input: text }),
        });
        data = await fallback.json();
      }

      if (data) {
        setStrategy(data);
        setAgentBlocks(data.agents);
      }
    });
  }

  const handleBlocksChange = useCallback((agentKey: string, blocks: StrategyBlock[]) => {
    setAgentBlocks((prev) => ({ ...prev, [agentKey]: blocks }));
  }, []);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#08111f] text-white">

      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#0b1628]/95 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white/70">Onchain Strategy Studio</span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
            Live on opBNB
          </span>
          {strategy && (
            <span className="text-xs text-white/35">{strategy.name}</span>
          )}
        </div>

        {/* Lifecycle */}
        <div className="flex items-center gap-0.5">
          {LIFECYCLE.map((step, idx) => (
            <div key={step} className="flex items-center gap-0.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                  idx === 0 ? "bg-cyan-400/15 text-cyan-300" : "text-white/20"
                }`}
              >
                {step}
              </span>
              {idx < LIFECYCLE.length - 1 && (
                <span className="text-[10px] text-white/10">›</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/55 hover:bg-white/10">
            Backtest
          </button>
          <button className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/55 hover:bg-white/10">
            Simulate
          </button>
          <button
            disabled={!strategy}
            className="rounded-lg bg-cyan-400 px-3 py-1 text-[10px] font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-30"
          >
            Deploy
          </button>
        </div>
      </header>

      {/* Main: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="flex w-56 shrink-0 flex-col gap-2.5 overflow-y-auto border-r border-white/10 bg-[#0a1425] p-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Agents
            </div>
            {AGENTS.map(({ key, label, color, border, bg, dot }) => (
              <div
                key={key}
                className={`mb-1.5 flex items-center justify-between rounded-xl border ${border} ${bg} px-2.5 py-1.5`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className={`text-[10px] font-medium ${color}`}>{label}</span>
                </div>
                <span className="text-[10px] text-white/30">
                  {agentBlocks[key as keyof AgentBlocks]?.length ?? 0} blk
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Examples
            </div>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setInput(ex); generate(ex); }}
                className="mb-1 w-full rounded-xl border border-white/10 bg-[#0d1a2d] px-2.5 py-2 text-left text-[11px] leading-relaxed text-white/55 hover:border-white/20 hover:text-white/80"
              >
                {ex}
              </button>
            ))}
          </div>
        </aside>

        {/* DAG Canvas */}
        <div className="relative flex-1 overflow-hidden">
          {/* Floating strategy input bar */}
          <div className="absolute top-4 left-1/2 z-10 flex w-[560px] -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-[#0b1628]/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); generate(input); } }}
              placeholder="Describe your strategy..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            />
            <button
              onClick={() => generate(input)}
              disabled={!input.trim() || isPending}
              className="shrink-0 rounded-xl bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-30"
            >
              {isPending ? "..." : "Generate"}
            </button>
          </div>

          <FlowCanvas agentBlocks={agentBlocks} onBlocksChange={handleBlocksChange} />
        </div>
      </div>
    </div>
  );
}
