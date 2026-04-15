"use client";

import { memo, useId } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BlockCard from "@/components/BlockCard";
import BlockPicker from "@/components/BlockPicker";
import { useState } from "react";
import type { BlockError } from "@/lib/blockValidator";

const AI_MODELS = [
  { value: "gpt-4o-mini",        label: "GPT-4o mini",   short: "GPT" },
  { value: "claude-sonnet-4-6",  label: "Claude Sonnet", short: "Claude" },
] as const;

export type ModelValue = (typeof AI_MODELS)[number]["value"];

export type AgentZoneData = {
  label: string;
  agentKey: string;
  color: string;
  borderColor: string;
  bgColor: string;
  blocks: Array<{ type: string; fields: Record<string, string | number>; children?: Array<{ type: string; fields: Record<string, string | number> }> }>;
  errors: BlockError[];
  model: ModelValue;
  onBlocksChange: (agentKey: string, blocks: AgentZoneData["blocks"]) => void;
  onModelChange: (agentKey: string, model: ModelValue) => void;
  onDuplicate?: (agentKey: string) => void;
};

function DraggableBlock({
  id,
  block,
  color,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onChildrenChange,
  error,
}: {
  id: string;
  block: AgentZoneData["blocks"][0];
  color: string;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (fields: Record<string, string | number>) => void;
  onDelete: () => void;
  onChildrenChange?: (children: AgentZoneData["blocks"]) => void;
  error?: { severity: "error" | "warning"; message: string };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        e.stopPropagation();
        listeners?.onPointerDown?.(e);
      }}
    >
      <div style={{ position: "relative" }}>
        <BlockCard
          block={block}
          color={color}
          isFirst={isFirst}
          isLast={isLast}
          editing={true}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onChildrenChange={onChildrenChange}
        />
        {error && (
          <div
            style={{
              position: "absolute",
              top: 4, right: 4,
              fontSize: 8,
              fontWeight: "bold",
              padding: "1px 5px",
              borderRadius: 20,
              background: error.severity === "error" ? "rgba(239,68,68,0.9)" : "rgba(245,158,11,0.9)",
              color: "white",
              zIndex: 10,
              pointerEvents: "none",
            }}
            title={error.message}
          >
            {error.severity === "error" ? "E" : "W"}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentZoneNode({ data }: NodeProps) {
  const d = data as AgentZoneData;
  const [showPicker, setShowPicker] = useState(false);
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  function handleChildrenChange(index: number, children: AgentZoneData["blocks"]) {
    const updated = [...d.blocks];
    updated[index] = { ...updated[index], children };
    d.onBlocksChange(d.agentKey, updated);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = d.blocks.findIndex((_, i) => `${d.agentKey}-${i}` === active.id);
    const newIdx = d.blocks.findIndex((_, i) => `${d.agentKey}-${i}` === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      d.onBlocksChange(d.agentKey, arrayMove(d.blocks, oldIdx, newIdx));
    }
  }

  const blockIds = d.blocks.map((_, i) => `${d.agentKey}-${i}`);

  return (
    <div
      className="relative flex flex-col rounded-2xl backdrop-blur-sm"
      style={{
        width: 300,
        minHeight: 100,
        border: `1px solid ${d.borderColor}40`,
        background: d.bgColor,
        boxShadow: `0 0 40px ${d.borderColor}12`,
      }}
    >
      {/* Zone header — drag handle for moving the zone */}
      <div
        className="zone-drag-handle flex cursor-grab items-center justify-between rounded-t-2xl px-4 py-2 active:cursor-grabbing"
        style={{ borderBottom: `1px solid ${d.borderColor}25` }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: d.color }}>{d.label.toUpperCase()}</span>
          {d.blocks.length > 0 && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/30">{d.blocks.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Model selector */}
          <select
            value={d.model}
            onChange={(e) => d.onModelChange(d.agentKey, e.target.value as ModelValue)}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded px-1.5 py-0.5 text-[9px] font-medium outline-none cursor-pointer"
            style={{
              background: `${d.color}18`,
              border: `1px solid ${d.color}35`,
              color: `${d.color}cc`,
            }}
            title="AI model for this agent"
          >
            {AI_MODELS.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0d1727] text-white">
                {m.short}
              </option>
            ))}
          </select>
          {d.onDuplicate && (
            <button
              onClick={(e) => { e.stopPropagation(); d.onDuplicate!(d.agentKey); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded px-1.5 py-0.5 text-[10px] text-white/20 hover:bg-white/10 hover:text-white/50"
              title="Duplicate zone"
            >
              copy
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded px-2 py-0.5 text-[10px] text-white/30 hover:bg-white/10 hover:text-white/60"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div className="p-2">
        {d.blocks.length === 0 ? (
          <div
            className="rounded-lg border border-dashed px-3 py-6 text-center text-[11px]"
            style={{ borderColor: `${d.borderColor}20`, color: `${d.color}40` }}
          >
            Click + Add or drag blocks here
          </div>
        ) : (
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
              {d.blocks.map((b, i) => (
                <DraggableBlock
                  key={blockIds[i]}
                  id={blockIds[i]}
                  block={b}
                  color={d.color}
                  isFirst={i === 0}
                  isLast={i === d.blocks.length - 1}
                  onUpdate={(fields) => handleUpdateBlock(i, fields)}
                  onDelete={() => handleDeleteBlock(i)}
                  onChildrenChange={(children) => handleChildrenChange(i, children)}
                  error={d.errors.find(e => e.blockIndex === i)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Validation errors — zone-level only (block-level shown inline on the block) */}
      {d.errors.filter(e => e.blockIndex === undefined).length > 0 && (
        <div className="mx-2 mb-2 flex flex-col gap-1">
          {d.errors.filter(e => e.blockIndex === undefined).map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px]"
              style={{
                background: err.severity === "error" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                border: `1px solid ${err.severity === "error" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                color: err.severity === "error" ? "#fca5a5" : "#fcd34d",
              }}
            >
              <span className="shrink-0 font-bold">{err.severity === "error" ? "E" : "W"}</span>
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Picker dropdown */}
      {showPicker && (
        <div className="absolute left-2 top-full z-50 mt-1">
          <BlockPicker
            agentKey={d.agentKey}
            color={d.color}
            onAdd={handleAddBlock}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Left} style={{ background: d.color, border: `2px solid ${d.bgColor}`, width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: d.color, border: `2px solid ${d.bgColor}`, width: 10, height: 10 }} />
    </div>
  );
}

export default memo(AgentZoneNode);
