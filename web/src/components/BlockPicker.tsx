"use client";

import { useState } from "react";
import { getBlocksForAgent, type BlockDefinition, type BlockShape } from "@/lib/blockRegistry";

interface BlockPickerProps {
  agentKey: string;
  color: string;
  onAdd: (blockType: string, fields: Record<string, string | number>) => void;
  onClose: () => void;
}

const SHAPE_GROUPS: { label: string; shapes: BlockShape[]; desc: string }[] = [
  { label: "TRIGGER", shapes: ["hat", "cblock"], desc: "starts or controls a flow" },
  { label: "ACTION",  shapes: ["stack"],          desc: "executes an operation" },
  { label: "OUTPUT",  shapes: ["cap"],             desc: "emits signal downstream" },
];

export default function BlockPicker({ agentKey, color, onAdd, onClose }: BlockPickerProps) {
  const blocks = getBlocksForAgent(agentKey);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const groups = SHAPE_GROUPS
    .map((g) => ({ ...g, blocks: blocks.filter((b) => g.shapes.includes(b.shape)) }))
    .filter((g) => g.blocks.length > 0);

  return (
    <div className="rounded-xl border border-white/15 bg-[#0d1727] p-2 shadow-2xl" style={{ minWidth: 230 }}>
      <div className="mb-1.5 flex items-center justify-between px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Add block</span>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">esc</button>
      </div>

      {groups.map((group) => (
        <div key={group.label}>
          {/* Section header */}
          <div className="flex items-center gap-1.5 px-2 py-1 mt-1">
            <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: `${color}70` }}>
              {group.label}
            </span>
            <div className="flex-1 border-t" style={{ borderColor: `${color}20` }} />
          </div>

          {/* Blocks in this group */}
          <div className="flex flex-col gap-0.5 mb-1">
            {group.blocks.map((def: BlockDefinition) => (
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
      ))}
    </div>
  );
}
