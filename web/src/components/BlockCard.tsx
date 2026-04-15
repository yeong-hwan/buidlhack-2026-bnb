"use client";

import { useState, useId } from "react";
import { getBlockDef, getBlocksForAgent } from "@/lib/blockRegistry";
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

interface BlockData {
  type: string;
  fields: Record<string, string | number>;
  children?: BlockData[];
}

interface BlockCardProps {
  block: BlockData;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  editing: boolean;
  depth?: number;
  onUpdate: (fields: Record<string, string | number>) => void;
  onDelete: () => void;
  onChildrenChange?: (children: BlockData[]) => void;
}

function DraggableChild({
  id, child, color, isFirst, isLast, editing, depth,
  onUpdate, onDelete, onChildrenChange,
}: { id: string } & Omit<BlockCardProps, "block"> & { child: BlockData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, cursor: "grab" }}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => { e.stopPropagation(); listeners?.onPointerDown?.(e); }}
    >
      <BlockCard
        block={child} color={color} isFirst={isFirst} isLast={isLast}
        editing={editing} depth={depth} onUpdate={onUpdate} onDelete={onDelete}
        onChildrenChange={onChildrenChange}
      />
    </div>
  );
}

export default function BlockCard({
  block, color, isFirst, isLast, editing, depth = 0,
  onUpdate, onDelete, onChildrenChange,
}: BlockCardProps) {
  const def = getBlockDef(block.type);
  const shape = def?.shape ?? "stack";
  const keyword = def?.keyword ?? block.type.split("_")[0];
  const label = def?.label ?? block.type.split("_").slice(1).join(" ");
  const detail = def?.detail(block.fields) ?? "";

  const [editingField, setEditingField] = useState<string | null>(null);
  const [childPickerOpen, setChildPickerOpen] = useState(false);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleFieldChange(fn: string, v: string | number) {
    onUpdate({ ...block.fields, [fn]: v });
    setEditingField(null);
  }

  const bg     = `${color}35`;
  const bgDark = `${color}50`;
  const inputBg = "rgba(0,0,0,0.25)";
  const inputBorder = "rgba(255,255,255,0.15)";

  const topR  = shape === "hat" || shape === "cblock" ? "8px" : "3px";
  const botR  = shape === "cap" ? "8px" : shape === "cblock" ? "0" : "3px";
  const radius = `${topR} ${topR} ${botR} ${botR}`;

  function renderField(fieldName: string) {
    if (!def) return null;
    const fieldDef = def.fields[fieldName];
    if (!fieldDef) return null;
    const val = block.fields[fieldName];

    if (editing && editingField === fieldName) {
      const cls = "rounded-full px-2 py-0.5 text-[10px] text-white outline-none";
      const st = { background: inputBg, border: `1.5px solid ${color}` };
      if (fieldDef.kind === "select") {
        return (
          <select key={fieldName} value={String(val)} onChange={(e) => handleFieldChange(fieldName, e.target.value)} onBlur={() => setEditingField(null)} autoFocus className={cls} style={st}
            onPointerDown={(e) => e.stopPropagation()}>
            {fieldDef.options.map((o) => <option key={o.value} value={o.value} className="bg-[#1a1a2e]">{o.label}</option>)}
          </select>
        );
      }
      if (fieldDef.kind === "number") {
        return <input key={fieldName} type="number" value={val} min={fieldDef.min} max={fieldDef.max} step={fieldDef.step ?? 1} onChange={(e) => handleFieldChange(fieldName, Number(e.target.value))} onBlur={() => setEditingField(null)} onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }} autoFocus className={`${cls} w-14`} style={st} onPointerDown={(e) => e.stopPropagation()} />;
      }
      return <input key={fieldName} type="text" value={String(val)} onChange={(e) => handleFieldChange(fieldName, e.target.value)} onBlur={() => setEditingField(null)} onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }} autoFocus className={`${cls} w-20`} style={st} onPointerDown={(e) => e.stopPropagation()} />;
    }

    return (
      <button key={fieldName}
        onClick={(e) => { if (editing) { e.stopPropagation(); setEditingField(fieldName); } }}
        onPointerDown={(e) => e.stopPropagation()}
        className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white/90"
        style={{ background: inputBg, border: `1.5px solid ${inputBorder}`, cursor: editing ? "pointer" : "default" }}
      >
        {String(val)}
      </button>
    );
  }

  function renderBody(customRadius?: string) {
    return (
      <div className="flex items-center gap-1" style={{
        background: bg, borderRadius: customRadius ?? radius,
        boxShadow: `inset 0 -3px 0 ${bgDark}`, padding: "6px 0", minHeight: 36,
      }}>
        <div className="flex shrink-0 items-center justify-center self-stretch rounded-l-[inherit] px-2.5" style={{ background: bgDark, minWidth: 50 }}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">{keyword}</span>
        </div>
        <span className="px-1.5 text-[11px] font-bold text-white">{label}</span>
        <div className="ml-auto flex items-center gap-1 pr-2">
          {def ? Object.keys(def.fields).map(renderField) : (
            detail && <span className="rounded-full px-2 py-0.5 text-[10px] text-white/70" style={{ background: inputBg }}>{detail}</span>
          )}
        </div>
        {editing && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} onPointerDown={(e) => e.stopPropagation()} className="pr-2 text-[10px] font-bold text-white/30 hover:text-red-300">x</button>
        )}
      </div>
    );
  }

  // ── C-block with sortable children ────────────────
  if (shape === "cblock") {
    const children = block.children ?? [];
    const childIds = children.map((_, i) => `child-${dndId}-${i}`);
    const blockDef = getBlockDef(block.type);
    const agentKey = blockDef?.agent ?? "manager";
    const addableBlocks = getBlocksForAgent(agentKey).filter((b) => b.shape === "stack");

    function handleChildDragEnd(event: DragEndEvent) {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = childIds.indexOf(String(active.id));
      const newIdx = childIds.indexOf(String(over.id));
      if (oldIdx !== -1 && newIdx !== -1) {
        onChildrenChange?.(arrayMove(children, oldIdx, newIdx));
      }
    }

    function handleAddChild(type: string) {
      const def = addableBlocks.find((b) => b.type === type);
      if (!def) return;
      onChildrenChange?.([...children, { type: def.type, fields: { ...def.defaults } }]);
      setChildPickerOpen(false);
    }

    return (
      <div style={{ marginBottom: 2 }}>
        {renderBody("8px 8px 0 0")}

        {/* C-block mouth */}
        <div style={{
          marginLeft: 18,
          borderLeft: `4px solid ${bgDark}`,
          borderBottom: `2px solid ${bgDark}`,
          background: `${color}08`,
          minHeight: 36,
          padding: "4px 4px 4px 4px",
          position: "relative",
        }}>
          {children.length > 0 && (
            <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd}>
              <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                {children.map((child, idx) => (
                  <DraggableChild
                    key={childIds[idx]} id={childIds[idx]} child={child} color={color}
                    isFirst={idx === 0} isLast={idx === children.length - 1}
                    editing={editing} depth={depth + 1}
                    onUpdate={(fields) => { onChildrenChange?.(children.map((c, i) => i === idx ? { ...c, fields } : c)); }}
                    onDelete={() => onChildrenChange?.(children.filter((_, i) => i !== idx))}
                    onChildrenChange={(gc) => { onChildrenChange?.(children.map((c, i) => i === idx ? { ...c, children: gc } : c)); }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Add child button */}
          {editing && (
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setChildPickerOpen((v) => !v); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="mt-1 flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold transition-colors hover:bg-white/10"
                style={{ color: `${color}80` }}
              >
                + add block
              </button>
              {childPickerOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-white/15 bg-[#0d1727] p-1.5 shadow-2xl"
                  style={{ minWidth: 180 }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {addableBlocks.map((b) => (
                    <button
                      key={b.type}
                      onClick={(e) => { e.stopPropagation(); handleAddChild(b.type); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-white/5"
                    >
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ color, background: `${color}20` }}>{b.keyword}</span>
                      <span className="text-[10px] text-white/70">{b.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom cap */}
        <div style={{
          background: bg,
          borderRadius: "0 0 8px 8px",
          boxShadow: `inset 0 -3px 0 ${bgDark}`,
          height: 14,
          marginLeft: 0,
        }} />
      </div>
    );
  }

  // ── Hat / Cap / Stack ─────────────────────────────
  return (
    <div style={{ marginBottom: shape === "cap" || isLast ? 0 : 2 }}>
      {renderBody()}
    </div>
  );
}
