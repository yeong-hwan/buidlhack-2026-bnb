"use client";

import { useState } from "react";
import { getBlockDef } from "@/lib/blockRegistry";

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

function TopNotch({ color }: { color: string }) {
  return (
    <div className="flex justify-start pl-5">
      <svg width="16" height="6" viewBox="0 0 16 6">
        <path d="M0 0 L3 0 L3 3 Q3 6 6 6 L10 6 Q13 6 13 3 L13 0 L16 0" fill={`${color}30`} />
      </svg>
    </div>
  );
}

function BottomNotch({ color }: { color: string }) {
  return (
    <div className="flex justify-start pl-5">
      <svg width="16" height="6" viewBox="0 0 16 6">
        <path d="M0 6 L3 6 L3 3 Q3 0 6 0 L10 0 Q13 0 13 3 L13 6 L16 6" fill={`${color}30`} />
      </svg>
    </div>
  );
}

function FieldEditors({
  def,
  block,
  color,
  editing,
  editingField,
  setEditingField,
  handleFieldChange,
}: {
  def: ReturnType<typeof getBlockDef>;
  block: BlockData;
  color: string;
  editing: boolean;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  handleFieldChange: (fieldName: string, value: string | number) => void;
}) {
  const detail = def?.detail(block.fields) ?? "";

  return (
    <div className="ml-auto flex items-center gap-1 px-2.5 py-2">
      {editing && def ? (
        Object.entries(def.fields).map(([fieldName, fieldDef]) => {
          const val = block.fields[fieldName];
          if (editingField === fieldName) {
            if (fieldDef.kind === "select") {
              return (
                <select
                  key={fieldName}
                  value={String(val)}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  onBlur={() => setEditingField(null)}
                  autoFocus
                  className="rounded-md bg-black/30 px-1.5 py-1 text-[10px] text-white outline-none"
                  style={{ border: `1px solid ${color}50` }}
                >
                  {fieldDef.options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0d1727]">
                      {o.label}
                    </option>
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
                  className="w-16 rounded-md bg-black/30 px-1.5 py-1 text-[10px] text-white outline-none"
                  style={{ border: `1px solid ${color}50` }}
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
                className="w-24 rounded-md bg-black/30 px-1.5 py-1 text-[10px] text-white outline-none"
                style={{ border: `1px solid ${color}50` }}
              />
            );
          }
          return (
            <button
              key={fieldName}
              onClick={(e) => { e.stopPropagation(); setEditingField(fieldName); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md px-2 py-1 font-mono text-[10px] text-white/60 transition-colors hover:text-white"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}
              title={`Edit ${fieldName}`}
            >
              {String(val)}
            </button>
          );
        })
      ) : (
        detail && (
          <span
            className="rounded-md px-2 py-1 font-mono text-[10px] text-white/50"
            style={{ background: `${color}10`, border: `1px solid ${color}20` }}
          >
            {detail}
          </span>
        )
      )}
    </div>
  );
}

function BlockHeader({
  block,
  color,
  editing,
  borderRadius,
  onDelete,
}: {
  block: BlockData;
  color: string;
  editing: boolean;
  borderRadius: string;
  onDelete: () => void;
}) {
  const def = getBlockDef(block.type);
  const keyword = def?.keyword ?? block.type.split("_")[0];
  const label = def?.label ?? block.type.split("_").slice(1).join(" ");
  const isAI = keyword === "AI";
  const isOutput = keyword === "→ out";

  const [editingField, setEditingField] = useState<string | null>(null);

  function handleFieldChange(fieldName: string, value: string | number) {
    // This is handled by parent; noop here — see BlockCard for real handler
    void fieldName; void value;
  }

  return (
    <div
      className="group relative flex items-stretch overflow-hidden"
      style={{
        background: `${color}15`,
        border: `2px solid ${color}35`,
        borderRadius,
        borderLeft: `4px solid ${color}`,
        minHeight: 38,
      }}
    >
      {/* Keyword badge */}
      <div
        className="flex shrink-0 items-center px-2.5"
        style={{
          background: isAI ? `${color}30` : isOutput ? `${color}25` : `${color}20`,
          borderRight: `1px solid ${color}25`,
          minWidth: 52,
        }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: isAI ? "#fff" : color }}
        >
          {keyword}
        </span>
      </div>

      {/* Label */}
      <div className="flex items-center px-2.5 py-2">
        <span className="text-[11px] font-semibold text-white/85">{label}</span>
      </div>

      {/* Field editors placeholder — rendered by parent for state management */}
      <div className="ml-auto flex items-center gap-1 px-2.5 py-2" id={`fields-${block.type}`} />

      {/* Delete button */}
      {editing && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center px-2 text-[11px] text-white/20 hover:text-red-400"
        >
          x
        </button>
      )}
    </div>
  );
}

export default function BlockCard({
  block,
  color,
  isFirst,
  isLast,
  editing,
  depth = 0,
  onUpdate,
  onDelete,
  onChildrenChange,
}: BlockCardProps) {
  const def = getBlockDef(block.type);
  const shape = def?.shape ?? "stack";
  const keyword = def?.keyword ?? block.type.split("_")[0];
  const label = def?.label ?? block.type.split("_").slice(1).join(" ");
  const detail = def?.detail(block.fields) ?? "";
  const isAI = keyword === "AI";
  const isOutput = keyword === "→ out";

  const [editingField, setEditingField] = useState<string | null>(null);

  function handleFieldChange(fieldName: string, value: string | number) {
    onUpdate({ ...block.fields, [fieldName]: value });
    setEditingField(null);
  }

  // Determine border radius for header based on shape and position
  const topRounded = shape === "hat" || isFirst;
  const bottomRounded = shape === "cap" || (shape === "stack" && isLast);
  const borderRadius =
    topRounded && bottomRounded
      ? "10px"
      : topRounded
      ? "10px 10px 4px 4px"
      : bottomRounded
      ? "4px 4px 10px 10px"
      : "4px";

  const headerEl = (
    <div
      className="group relative flex items-stretch overflow-hidden"
      style={{
        background: `${color}15`,
        border: `2px solid ${color}35`,
        borderRadius: shape === "cblock" ? "10px 10px 0 0" : borderRadius,
        borderLeft: `4px solid ${color}`,
        minHeight: 38,
      }}
    >
      {/* Keyword badge */}
      <div
        className="flex shrink-0 items-center px-2.5"
        style={{
          background: isAI ? `${color}30` : isOutput ? `${color}25` : `${color}20`,
          borderRight: `1px solid ${color}25`,
          minWidth: 52,
        }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: isAI ? "#fff" : color }}
        >
          {keyword}
        </span>
      </div>

      {/* Label */}
      <div className="flex items-center px-2.5 py-2">
        <span className="text-[11px] font-semibold text-white/85">{label}</span>
      </div>

      {/* Field values / editors */}
      <div className="ml-auto flex items-center gap-1 px-2.5 py-2">
        {editing && def ? (
          Object.entries(def.fields).map(([fieldName, fieldDef]) => {
            const val = block.fields[fieldName];
            if (editingField === fieldName) {
              if (fieldDef.kind === "select") {
                return (
                  <select
                    key={fieldName}
                    value={String(val)}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="rounded-md bg-black/30 px-1.5 py-1 text-[10px] text-white outline-none"
                    style={{ border: `1px solid ${color}50` }}
                  >
                    {fieldDef.options.map((o) => (
                      <option key={o.value} value={o.value} className="bg-[#0d1727]">
                        {o.label}
                      </option>
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
                    className="w-16 rounded-md bg-black/30 px-1.5 py-1 text-[10px] text-white outline-none"
                    style={{ border: `1px solid ${color}50` }}
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
                  className="w-24 rounded-md bg-black/30 px-1.5 py-1 text-[10px] text-white outline-none"
                  style={{ border: `1px solid ${color}50` }}
                />
              );
            }
            return (
              <button
                key={fieldName}
                onClick={(e) => { e.stopPropagation(); setEditingField(fieldName); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-md px-2 py-1 font-mono text-[10px] text-white/60 transition-colors hover:text-white"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                title={`Edit ${fieldName}`}
              >
                {String(val)}
              </button>
            );
          })
        ) : (
          detail && (
            <span
              className="rounded-md px-2 py-1 font-mono text-[10px] text-white/50"
              style={{ background: `${color}10`, border: `1px solid ${color}20` }}
            >
              {detail}
            </span>
          )
        )}
      </div>

      {/* Delete button */}
      {editing && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center px-2 text-[11px] text-white/20 hover:text-red-400"
        >
          x
        </button>
      )}
    </div>
  );

  // ── Hat block ───────────────────────────────────────────────────────────────
  if (shape === "hat") {
    return (
      <div className="relative">
        {headerEl}
        {!isLast && <BottomNotch color={color} />}
      </div>
    );
  }

  // ── Cap block ───────────────────────────────────────────────────────────────
  if (shape === "cap") {
    return (
      <div className="relative">
        {!isFirst && <TopNotch color={color} />}
        {headerEl}
      </div>
    );
  }

  // ── C-block ─────────────────────────────────────────────────────────────────
  if (shape === "cblock") {
    const children = block.children ?? [];

    function handleChildUpdate(idx: number, fields: Record<string, string | number>) {
      const next = children.map((c, i) => i === idx ? { ...c, fields } : c);
      onChildrenChange?.(next);
    }

    function handleChildDelete(idx: number) {
      const next = children.filter((_, i) => i !== idx);
      onChildrenChange?.(next);
    }

    function handleGrandchildrenChange(idx: number, grandchildren: BlockData[]) {
      const next = children.map((c, i) => i === idx ? { ...c, children: grandchildren } : c);
      onChildrenChange?.(next);
    }

    return (
      <div className="relative">
        {!isFirst && <TopNotch color={color} />}

        {/* Header row */}
        {headerEl}

        {/* Inner body — indented with colored left bar */}
        <div
          style={{
            marginLeft: 20,
            borderLeft: `3px solid ${color}`,
            minHeight: 30,
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {children.length === 0 ? (
            <div
              className="flex items-center px-3 text-[10px] text-white/25 italic"
              style={{ minHeight: 30 }}
            >
              drop blocks here
            </div>
          ) : (
            children.map((child, idx) => (
              <BlockCard
                key={idx}
                block={child}
                color={color}
                isFirst={idx === 0}
                isLast={idx === children.length - 1}
                editing={editing}
                depth={depth + 1}
                onUpdate={(fields) => handleChildUpdate(idx, fields)}
                onDelete={() => handleChildDelete(idx)}
                onChildrenChange={(gc) => handleGrandchildrenChange(idx, gc)}
              />
            ))
          )}
        </div>

        {/* Bottom closing bar */}
        <div
          style={{
            background: `${color}15`,
            border: `2px solid ${color}35`,
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            borderLeft: `4px solid ${color}`,
            minHeight: 12,
          }}
        />

        {!isLast && <BottomNotch color={color} />}
      </div>
    );
  }

  // ── Stack block (default) ───────────────────────────────────────────────────
  return (
    <div className="relative">
      {!isFirst && <TopNotch color={color} />}
      {headerEl}
      {!isLast && <BottomNotch color={color} />}
    </div>
  );
}
