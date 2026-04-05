"use client";

import { memo, useState, useId } from "react";
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

export type AgentZoneData = {
  label: string;
  agentKey: string;
  color: string;
  borderColor: string;
  bgColor: string;
  blocks: Array<{ type: string; fields: Record<string, string | number> }>;
  onBlocksChange: (agentKey: string, blocks: Array<{ type: string; fields: Record<string, string | number> }>) => void;
};

function SortableBlock({
  id,
  block,
  color,
  isFirst,
  isLast,
  editing,
  onUpdate,
  onDelete,
}: {
  id: string;
  block: { type: string; fields: Record<string, string | number> };
  color: string;
  isFirst: boolean;
  isLast: boolean;
  editing: boolean;
  onUpdate: (fields: Record<string, string | number>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-0">
        {editing && (
          <div
            {...attributes}
            {...listeners}
            onPointerDown={(e) => { e.stopPropagation(); listeners?.onPointerDown?.(e); }}
            className="mt-2 flex shrink-0 cursor-grab items-center px-1 text-white/20 hover:text-white/40 active:cursor-grabbing"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
              <circle cx="2" cy="2" r="1.2" />
              <circle cx="6" cy="2" r="1.2" />
              <circle cx="2" cy="7" r="1.2" />
              <circle cx="6" cy="7" r="1.2" />
              <circle cx="2" cy="12" r="1.2" />
              <circle cx="6" cy="12" r="1.2" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <BlockCard
            block={block}
            color={color}
            isFirst={isFirst}
            isLast={isLast}
            editing={editing}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}

function AgentZoneNode({ data }: NodeProps) {
  const d = data as AgentZoneData;
  const [editing, setEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
          {d.blocks.length > 0 && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/30">
              {d.blocks.length}
            </span>
          )}
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
        ) : editing ? (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
              {d.blocks.map((b, i) => (
                <SortableBlock
                  key={blockIds[i]}
                  id={blockIds[i]}
                  block={b}
                  color={d.color}
                  isFirst={i === 0}
                  isLast={i === d.blocks.length - 1}
                  editing
                  onUpdate={(fields) => handleUpdateBlock(i, fields)}
                  onDelete={() => handleDeleteBlock(i)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          d.blocks.map((b, i) => (
            <BlockCard
              key={`${b.type}-${i}`}
              block={b}
              color={d.color}
              isFirst={i === 0}
              isLast={i === d.blocks.length - 1}
              editing={false}
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
