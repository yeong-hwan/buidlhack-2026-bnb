"use client";

import dynamic from "next/dynamic";
import { useState, useTransition, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import type { StrategyResponse, StrategyBlock, AgentBlocks } from "@/app/api/strategy/route";
import type { ModelValue } from "@/components/nodes/AgentZoneNode";
import ChatThread, { type ChatMessage } from "@/components/ChatThread";
import BlockPalette from "@/components/BlockPalette";

const FlowCanvas = dynamic(() => import("@/components/FlowCanvas"), { ssr: false });

type AgentKey = keyof AgentBlocks;

const LIFECYCLE = ["Design", "Backtest", "Deploy", "Observe", "Iterate", "Marketplace"];

const AGENTS = [
  { key: "data",    label: "Data Feed",   color: "text-amber-300",  border: "border-amber-400/30",  bg: "bg-amber-400/5",  dot: "bg-amber-400" },
  { key: "alpha",   label: "Alpha Agent", color: "text-cyan-300",   border: "border-cyan-400/30",   bg: "bg-cyan-400/5",   dot: "bg-cyan-400" },
  { key: "news",    label: "News Agent",  color: "text-violet-300", border: "border-violet-400/30", bg: "bg-violet-400/5", dot: "bg-violet-400" },
  { key: "manager", label: "Manager",     color: "text-emerald-300",border: "border-emerald-400/30",bg: "bg-emerald-400/5",dot: "bg-emerald-400" },
  { key: "risk",    label: "Risk Agent",  color: "text-rose-300",   border: "border-rose-400/30",   bg: "bg-rose-400/5",   dot: "bg-rose-400" },
] as const;

const DEFAULT_AGENTS: AgentBlocks = {
  data: [],
  alpha: [
    { type: "alpha_rsi",         fields: { TOKEN: "BNB", CONDITION: "oversold", THRESHOLD: 30 } },
    { type: "alpha_ma_cross",    fields: { TOKEN: "BNB", CROSS: "golden", SHORT: 7, LONG: 25 } },
    { type: "alpha_emit_signal", fields: { SIGNAL: "BUY", STRENGTH: 80 } },
  ],
  news: [],
  manager: [
    { type: "mgr_on_alpha", fields: { SIGNAL: "BUY" }, children: [
      { type: "mgr_buy", fields: { AMOUNT: 100, TOKEN: "BNB", DEX: "pancake" } },
    ]},
  ],
  risk: [
    { type: "risk_set_stop_loss",   fields: { PCT: 10 } },
    { type: "risk_set_take_profit", fields: { PCT: 20 } },
    { type: "risk_if_drawdown",     fields: { PCT: 20 }, children: [
      { type: "risk_cooldown", fields: { N: 24, UNIT: "hours" } },
    ]},
  ],
};

let msgId = 0;
function nextId() { return `msg-${++msgId}`; }

export default function StrategyPage() {
  const [input, setInput]             = useState("");
  const [strategy, setStrategy]       = useState<StrategyResponse | null>(null);
  const [agentBlocks, setAgentBlocks] = useState<AgentBlocks>(DEFAULT_AGENTS);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isPending, startTransition]  = useTransition();
  const [deployModal, setDeployModal] = useState(false);
  const [deploying, setDeploying]     = useState(false);
  const [deployTx, setDeployTx]       = useState<string | null>(null);

  const [agentModels, setAgentModels] = useState<Record<string, ModelValue>>({
    data: "gpt-4o-mini", alpha: "gpt-4o-mini", news: "gpt-4o-mini",
    manager: "gpt-4o-mini", risk: "gpt-4o-mini",
  });

  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const handleModelChange = useCallback((agentKey: string, model: ModelValue) => {
    setAgentModels((prev) => ({ ...prev, [agentKey]: model }));
  }, []);

  async function generate(text: string) {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: nextId(), role: "user", content: text, timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      const res = await fetch("/api/strategy/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          input: text,
          previousStrategy: strategy ? { name: strategy.name, agents: agentBlocks } : undefined,
        }),
      });

      let data: StrategyResponse | null = null;
      if (res.ok) {
        data = await res.json();
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

        const blockCounts: Record<string, number> = {};
        for (const [k, v] of Object.entries(data.agents)) {
          blockCounts[k] = (v as StrategyBlock[]).length;
        }

        const sysMsg: ChatMessage = {
          id: nextId(),
          role: "system",
          content: data.description || `Generated "${data.name}"`,
          strategyName: data.name,
          blockCounts,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, sysMsg]);
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
            onClick={() => {
              if (!strategy) return;
              if (!isConnected) { connect({ connector: connectors[0] }); return; }
              setDeployModal(true);
              setDeployTx(null);
            }}
            disabled={!strategy}
            className="rounded-lg bg-cyan-400 px-3 py-1 text-[10px] font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-30"
          >
            {!isConnected && strategy ? "Connect & Deploy" : "Deploy"}
          </button>
        </div>
      </header>

      {/* Deploy Modal */}
      {deployModal && strategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl border border-white/15 bg-[#0d1727] p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Deploy Strategy</h2>
                <p className="mt-0.5 text-[11px] text-white/40">{strategy.name}</p>
              </div>
              <button onClick={() => setDeployModal(false)} className="text-white/30 hover:text-white/60 text-lg leading-none">×</button>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              {(["data","alpha","news","manager","risk"] as const).map((k) => {
                const count = agentBlocks[k]?.length ?? 0;
                const colors: Record<string, string> = { data: "#f59e0b", alpha: "#22d3ee", news: "#a78bfa", manager: "#34d399", risk: "#fb7185" };
                const labels: Record<string, string> = { data: "Data Feed", alpha: "Alpha", news: "News", manager: "Manager", risk: "Risk" };
                return count > 0 ? (
                  <div key={k} className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ background: `${colors[k]}10`, border: `1px solid ${colors[k]}30` }}>
                    <span className="text-[11px] font-medium" style={{ color: colors[k] }}>{labels[k]}</span>
                    <span className="text-[10px] text-white/40">{count} blocks</span>
                  </div>
                ) : null;
              })}
            </div>

            <div className="mb-4 rounded-lg bg-white/5 px-3 py-2.5 text-[10px] text-white/40">
              <div className="mb-1 font-semibold text-white/60">Network</div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                opBNB Testnet (chain ID: 5611)
              </div>
            </div>

            {deployTx ? (
              <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/30 px-3 py-3">
                <div className="mb-1 text-[10px] font-semibold text-emerald-300">Strategy Registered!</div>
                <div className="font-mono text-[9px] text-emerald-200/60 break-all">{deployTx}</div>
              </div>
            ) : (
              <button
                disabled={deploying}
                onClick={async () => {
                  setDeploying(true);
                  await new Promise((r) => setTimeout(r, 1800));
                  setDeployTx("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
                  setDeploying(false);
                }}
                className="w-full rounded-xl bg-cyan-400 py-2.5 text-[11px] font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-50"
              >
                {deploying ? "Registering on opBNB..." : "Register on opBNB Testnet"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main: sidebar + canvas + chat */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — agents + block palette */}
        <aside className="flex w-52 shrink-0 flex-col gap-2.5 overflow-y-auto border-r border-white/10 bg-[#0a1425] p-3">
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
                  {agentBlocks[key as keyof AgentBlocks]?.length ?? 0}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <BlockPalette agentBlocks={agentBlocks} onAddBlock={handleBlocksChange} />
          </div>
        </aside>

        {/* DAG Canvas */}
        <div className="relative flex-1 overflow-hidden">
          <FlowCanvas
            agentBlocks={agentBlocks}
            agentModels={agentModels}
            onBlocksChange={handleBlocksChange}
            onModelChange={handleModelChange}
          />
        </div>

        {/* Right: Chat Thread */}
        <aside className="w-72 shrink-0 border-l border-white/10 bg-[#0a1425]">
          <ChatThread
            messages={messages}
            onSend={generate}
            isPending={isPending}
            input={input}
            onInputChange={setInput}
          />
        </aside>
      </div>
    </div>
  );
}
