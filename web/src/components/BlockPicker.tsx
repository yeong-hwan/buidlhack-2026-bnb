"use client";

import { useState } from "react";
import { getBlocksForAgent, type BlockDefinition } from "@/lib/blockRegistry";

interface BlockPickerProps {
  agentKey: string;
  color: string;
  onAdd: (blockType: string, fields: Record<string, string | number>) => void;
  onClose: () => void;
}

export default function BlockPicker({ agentKey, color, onAdd, onClose }: BlockPickerProps) {
  const blocks = getBlocksForAgent(agentKey);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-white/15 bg-[#0d1727] p-2 shadow-2xl" style={{ minWidth: 220 }}>
      <div className="mb-1.5 flex items-center justify-between px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Add block</span>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">esc</button>
      </div>
      <div className="flex flex-col gap-0.5">
        {blocks.map((def: BlockDefinition) => (
          <button
            key={def.type}
            onMouseEnter={() => setHoveredType(def.type)}
            onMouseLeave={() => setHoveredType(null)}
            onClick={() => { onAdd(def.type, { ...def.defaults }); onClose(); }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
          >
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
              style={{ color, background: `${color}20`, border: `1px solid ${color}30` }}
            >
              {def.keyword}
            </span>
            <span className="text-[11px] text-white/70">{def.label}</span>
            {hoveredType === def.type && (
              <span className="ml-auto text-[10px] text-white/25">{def.detail(def.defaults)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
