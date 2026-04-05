"use client";

import { useState } from "react";
import { getBlocksForAgent, type BlockDefinition } from "@/lib/blockRegistry";
import type { StrategyBlock, AgentBlocks } from "@/app/api/strategy/route";

interface AgentConfig {
  key: string;
  label: string;
  color: string;
  hexColor: string;
  dot: string;
}

const PALETTE_AGENTS: AgentConfig[] = [
  { key: "data",    label: "Data Feed",   color: "text-amber-300",   hexColor: "#f59e0b", dot: "bg-amber-400" },
  { key: "alpha",   label: "Alpha",       color: "text-cyan-300",    hexColor: "#22d3ee", dot: "bg-cyan-400" },
  { key: "news",    label: "News",        color: "text-violet-300",  hexColor: "#a78bfa", dot: "bg-violet-400" },
  { key: "manager", label: "Manager",     color: "text-emerald-300", hexColor: "#34d399", dot: "bg-emerald-400" },
  { key: "risk",    label: "Risk",        color: "text-rose-300",    hexColor: "#fb7185", dot: "bg-rose-400" },
];

interface BlockPaletteProps {
  agentBlocks: AgentBlocks;
  onAddBlock: (agentKey: string, blocks: StrategyBlock[]) => void;
}

function KeywordBadge({ keyword, hexColor }: { keyword: string; hexColor: string }) {
  const isOut = keyword === "→ out";
  const isAI  = keyword === "AI";
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: isAI ? `${hexColor}35` : isOut ? `${hexColor}28` : `${hexColor}22`,
        color: isAI ? "#fff" : hexColor,
        border: `1px solid ${hexColor}30`,
      }}
    >
      {keyword}
    </span>
  );
}

interface CategorySectionProps {
  agent: AgentConfig;
  blocks: BlockDefinition[];
  currentBlocks: StrategyBlock[];
  onAddBlock: (agentKey: string, blocks: StrategyBlock[]) => void;
}

function CategorySection({ agent, blocks, currentBlocks, onAddBlock }: CategorySectionProps) {
  const [open, setOpen] = useState(false);

  function handleAdd(def: BlockDefinition) {
    const newBlock: StrategyBlock = {
      type: def.type,
      fields: { ...def.defaults },
    };
    onAddBlock(agent.key, [...currentBlocks, newBlock]);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {/* Category header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-2.5 py-1.5 hover:bg-white/5 transition-colors"
        style={{ background: `${agent.hexColor}08` }}
      >
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${agent.dot}`} />
          <span className={`text-[10px] font-semibold ${agent.color}`}>{agent.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/30">{blocks.length}</span>
          <span
            className="text-[10px] text-white/30 transition-transform duration-150"
            style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </div>
      </button>

      {/* Block items */}
      {open && (
        <div className="border-t border-white/8 bg-white/[0.02]">
          {blocks.map((def) => (
            <button
              key={def.type}
              onClick={() => handleAdd(def)}
              className="flex w-full items-center gap-1.5 px-2 py-1 hover:bg-white/8 transition-colors"
              style={{ minHeight: 28 }}
              title={`Add ${def.label} to ${agent.label}`}
            >
              <KeywordBadge keyword={def.keyword} hexColor={agent.hexColor} />
              <span className="truncate text-[10px] text-white/70">{def.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlockPalette({ agentBlocks, onAddBlock }: BlockPaletteProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
        Block Palette
      </div>
      {PALETTE_AGENTS.map((agent) => (
        <CategorySection
          key={agent.key}
          agent={agent}
          blocks={getBlocksForAgent(agent.key)}
          currentBlocks={agentBlocks[agent.key as keyof AgentBlocks] ?? []}
          onAddBlock={onAddBlock}
        />
      ))}
    </div>
  );
}
