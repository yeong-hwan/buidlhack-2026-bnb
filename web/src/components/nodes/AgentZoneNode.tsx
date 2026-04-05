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

export type AgentZoneData = {
  label: string;
  agentKey: string;
  color: string;
  borderColor: string;
  bgColor: string;
  blocks: Array<{ type: string; fields: Record<string, string | number>; children?: Array<{ type: string; fields: Record<string, string | number> }> }>;
  onBlocksChange: (agentKey: string, blocks: AgentZoneData["blocks"]) => void;
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
}: {
  id: string;
  block: AgentZoneData["blocks"][0];
  color: string;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (fields: Record<string, string | number>) => void;
  onDelete: () => void;
  onChildrenChange?: (children: AgentZoneData["blocks"]) => void;
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
      {/* Zone header */}
      <div
        className="flex items-center justify-between rounded-t-2xl px-4 py-2"
        style={{ borderBottom: `1px solid ${d.borderColor}25` }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: d.color }}>{d.label.toUpperCase()}</span>
          {d.blocks.length > 0 && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/30">{d.blocks.length}</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded px-2 py-0.5 text-[10px] text-white/30 hover:bg-white/10 hover:text-white/60"
        >
          + Add
        </button>
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
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

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
