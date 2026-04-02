"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import BlockCard from "@/components/BlockCard";
import BlockPicker from "@/components/BlockPicker";

export type AgentZoneData = {
  label: string;
  agentKey: string;
  color: string;
  borderColor: string;
  bgColor: string;
  blocks: Array<{ type: string; fields: Record<string, string | number> }>;
  onBlocksChange: (agentKey: string, blocks: Array<{ type: string; fields: Record<string, string | number> }>) => void;
};

function AgentZoneNode({ data }: NodeProps) {
  const d = data as AgentZoneData;
  const [editing, setEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  function handleAddBlock(blockType: string, fields: Record<string, string | number>) {
    d.onBlocksChange(d.agentKey, [...d.blocks, { type: blockType, fields }]);
  }

  function handleUpdateBlock(index: number, fields: Record<string, string | number>) {
    const updated = [...d.blocks];
    updated[index] = { ...updated[index], fields };
    d.onBlocksChange(d.agentKey, updated);
  }

  function handleDeleteBlock(index: number) {
    d.onBlocksChange(d.agentKey, d.blocks.filter((_, i) => i !== index));
  }

  return (
    <div
      className="relative flex flex-col rounded-2xl backdrop-blur-sm"
      style={{
        width: editing ? 340 : 280,
        minHeight: 120,
        border: `1px solid ${d.borderColor}45`,
        background: d.bgColor,
        boxShadow: editing
          ? `0 0 60px ${d.borderColor}30, inset 0 0 30px ${d.borderColor}08`
          : `0 0 50px ${d.borderColor}15, inset 0 0 30px ${d.borderColor}05`,
        transition: "width 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Zone header */}
      <div
        className="flex items-center justify-between rounded-t-2xl px-4 py-2.5"
        style={{ borderBottom: `1px solid ${d.borderColor}30` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}
          />
          <span className="text-xs font-bold tracking-wide" style={{ color: d.color }}>
            {d.label.toUpperCase()}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(!editing); setShowPicker(false); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
            editing
              ? "bg-white/10 text-white/70"
              : "text-white/30 hover:bg-white/10 hover:text-white/60"
          }`}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-0 p-3">
        {d.blocks.length === 0 && !editing ? (
          <div
            className="rounded-md border border-dashed px-3 py-4 text-center text-[11px]"
            style={{ borderColor: `${d.borderColor}25`, color: `${d.color}40` }}
          >
            no blocks
          </div>
        ) : (
          d.blocks.map((b, i) => (
            <BlockCard
              key={`${b.type}-${i}`}
              block={b}
              color={d.color}
              isFirst={i === 0}
              isLast={i === d.blocks.length - 1 && !editing}
              editing={editing}
              onUpdate={(fields) => handleUpdateBlock(i, fields)}
              onDelete={() => handleDeleteBlock(i)}
            />
          ))
        )}

        {/* Add block button */}
        {editing && (
          <div className="relative mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full rounded-lg border border-dashed px-3 py-2 text-center text-[11px] transition-colors hover:bg-white/5"
              style={{ borderColor: `${d.borderColor}30`, color: `${d.color}60` }}
            >
              + Add block
            </button>
            {showPicker && (
              <div className="absolute left-0 top-full z-50 mt-1">
                <BlockPicker
                  agentKey={d.agentKey}
                  color={d.color}
                  onAdd={handleAddBlock}
                  onClose={() => setShowPicker(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: d.color, border: `2px solid ${d.bgColor}`, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: d.color, border: `2px solid ${d.bgColor}`, width: 10, height: 10 }}
      />
    </div>
  );
}

export default memo(AgentZoneNode);
