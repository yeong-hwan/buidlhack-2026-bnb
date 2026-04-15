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

const NOTCH_W = 15;
const NOTCH_H = 6;
const NOTCH_X = 18;

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

function BottomBump({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: -NOTCH_H,
        left: NOTCH_X,
        width: NOTCH_W,
        height: NOTCH_H,
        background: `${color}28`,
        borderRadius: "0 0 5px 5px",
        boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)",
        zIndex: 2,
      }}
    />
  );
}

function TopSocket() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: NOTCH_X,
        width: NOTCH_W,
        height: NOTCH_H,
        background: "rgba(0,0,0,0.45)",
        borderRadius: "0 0 4px 4px",
        zIndex: 3,
      }}
    />
  );
}

function DraggableChild({
  id, child, color, isFirst, isLast, editing, depth,
  onUpdate, onDelete, onChildrenChange,
}: { id: string } & Omit<BlockCardProps, "block"> & { child: BlockData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        marginBottom: isLast ? 0 : -NOTCH_H,
        position: "relative",
        zIndex: isLast ? 1 : undefined,
      }}
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

  const blockBg = `${color}28`;
  const keywordBg = `${color}50`;
  const fieldBg = "rgba(0,0,0,0.28)";
  const fieldBorder = "1px solid rgba(255,255,255,0.12)";

  const hasTopSocket = shape === "stack" || shape === "cap";
  const hasBottomBump = shape === "hat" || shape === "stack" || shape === "cblock";

  function borderRadius(shapeOverride?: string): string {
    const s = shapeOverride ?? shape;
    if (s === "hat") return "8px 8px 4px 4px";
    if (s === "cap") return "4px 4px 8px 8px";
    if (s === "cblock-header") return "8px 8px 0 0";
    if (s === "cblock-cap") return "0 0 8px 8px";
    return "4px";
  }

  function handleFieldChange(fn: string, v: string | number) {
    onUpdate({ ...block.fields, [fn]: v });
    setEditingField(null);
  }

  function renderField(fieldName: string) {
    if (!def) return null;
    const fieldDef = def.fields[fieldName];
    if (!fieldDef) return null;
    const val = block.fields[fieldName];

    const inputCls = "rounded-full px-2 py-0.5 text-[10px] text-white outline-none";
    const inputSt = { background: fieldBg, border: `1.5px solid ${color}` };

    if (editing && editingField === fieldName) {
      if (fieldDef.kind === "select") {
        return (
          <select
            key={fieldName}
            value={String(val)}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            onBlur={() => setEditingField(null)}
            autoFocus
            className={inputCls}
            style={inputSt}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {fieldDef.options.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1a2e]">{o.label}</option>
            ))}
          </select>
        );
      }
      if (fieldDef.kind === "number") {
        return (
          <input
            key={fieldName}
            type="number"
            value={val}
            min={fieldDef.min}
            max={fieldDef.max}
            step={fieldDef.step ?? 1}
            onChange={(e) => handleFieldChange(fieldName, Number(e.target.value))}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }}
            autoFocus
            className={`${inputCls} w-14`}
            style={inputSt}
            onPointerDown={(e) => e.stopPropagation()}
          />
        );
      }
      return (
        <input
          key={fieldName}
          type="text"
          value={String(val)}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }}
          autoFocus
          className={`${inputCls} w-20`}
          style={inputSt}
          onPointerDown={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <button
        key={fieldName}
        onClick={(e) => { if (editing) { e.stopPropagation(); setEditingField(fieldName); } }}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-[10px] font-medium text-white/90"
        style={{
          background: fieldBg,
          border: fieldBorder,
          borderRadius: 20,
          padding: "2px 8px",
          cursor: editing ? "pointer" : "default",
        }}
      >
        {String(val)}
      </button>
    );
  }

  function renderBlockRow(shapeKey: string, showTopSocket: boolean, showBottomBump: boolean) {
    const isHat = shapeKey === "hat";
    const isCap = shapeKey === "cap" || shapeKey === "cblock-cap";
    return (
      <div
        style={{
          position: "relative",
          background: blockBg,
          borderRadius: borderRadius(shapeKey),
          border: isHat
            ? `1.5px solid ${color}60`
            : isCap
            ? `1px solid ${color}30`
            : `1px solid ${color}40`,
          borderStyle: isCap ? "dashed" : "solid",
          minHeight: 36,
          width: "100%",
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {/* Shape indicator stripe */}
        {isHat && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 2,
            background: `${color}`,
            borderRadius: "4px 4px 0 0",
            opacity: 0.7,
          }} />
        )}
        {isCap && (
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: 2,
            background: `${color}`,
            borderRadius: "0 0 4px 4px",
            opacity: 0.4,
          }} />
        )}
        {showTopSocket && <TopSocket />}
        <div className="flex items-center gap-2 px-3 py-1.5">
          {/* OUT label for cap blocks */}
          {shapeKey === "cap" && (
            <span style={{ position: "absolute", right: editing ? 28 : 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: `${color}60`, fontWeight: "bold", letterSpacing: 1 }}>
              OUT
            </span>
          )}
          {/* Keyword badge */}
          <span
            className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider text-white"
            style={{ background: keywordBg, borderRadius: "6px", padding: "2px 6px" }}
          >
            {keyword}
          </span>
          {/* Label */}
          <span className="text-[11px] font-semibold text-white/80">{label}</span>
          {/* Fields */}
          <div className="flex items-center gap-1.5">
            {def ? Object.keys(def.fields).map(renderField) : (
              detail && (
                <span
                  className="text-[10px] text-white/70"
                  style={{ background: fieldBg, border: fieldBorder, borderRadius: 20, padding: "2px 8px" }}
                >
                  {detail}
                </span>
              )
            )}
          </div>
          {/* Delete */}
          {editing && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="ml-auto text-[10px] text-white/25 hover:text-red-300"
            >
              ×
            </button>
          )}
        </div>
        {showBottomBump && <BottomBump color={color} />}
      </div>
    );
  }

  // ── C-block ───────────────────────────────────────
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
      const childDef = addableBlocks.find((b) => b.type === type);
      if (!childDef) return;
      onChildrenChange?.([...children, { type: childDef.type, fields: { ...childDef.defaults } }]);
      setChildPickerOpen(false);
    }

    return (
      <div style={{ marginBottom: isLast ? 0 : NOTCH_H + 2, position: "relative" }}>
        {/* Header row */}
        {renderBlockRow("cblock-header", false, true)}

        {/* Mouth */}
        <div
          style={{
            marginLeft: NOTCH_X,
            borderLeft: `4px solid ${color}50`,
            background: `${color}10`,
            minHeight: 36,
            padding: "4px 4px 4px 4px",
            position: "relative",
          }}
        >
          {children.length > 0 && (
            <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd}>
              <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                {children.map((child, idx) => (
                  <DraggableChild
                    key={childIds[idx]}
                    id={childIds[idx]}
                    child={child}
                    color={color}
                    isFirst={idx === 0}
                    isLast={idx === children.length - 1}
                    editing={editing}
                    depth={depth + 1}
                    onUpdate={(fields) => {
                      onChildrenChange?.(children.map((c, i) => i === idx ? { ...c, fields } : c));
                    }}
                    onDelete={() => onChildrenChange?.(children.filter((_, i) => i !== idx))}
                    onChildrenChange={(gc) => {
                      onChildrenChange?.(children.map((c, i) => i === idx ? { ...c, children: gc } : c));
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

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
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ color, background: `${color}20` }}
                      >
                        {b.keyword}
                      </span>
                      <span className="text-[10px] text-white/70">{b.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom cap row */}
        <div
          style={{
            position: "relative",
            background: blockBg,
            borderRadius: borderRadius("cblock-cap"),
            border: `1px solid ${color}40`,
            height: 16,
            width: "100%",
          }}
        >
          <BottomBump color={color} />
        </div>
      </div>
    );
  }

  // ── Hat / Stack / Cap ─────────────────────────────
  return (
    <div
      style={{
        marginBottom: isLast ? 0 : -NOTCH_H,
        position: "relative",
        zIndex: isLast ? 1 : undefined,
      }}
    >
      {renderBlockRow(shape, hasTopSocket, hasBottomBump)}
    </div>
  );
}
