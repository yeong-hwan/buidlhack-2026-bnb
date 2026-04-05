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

// Notch dimensions
const NOTCH_W = 20;
const NOTCH_H = 6;
const NOTCH_OFFSET = 24;

function NotchPath({ color, direction }: { color: string; direction: "down" | "up" }) {
  // "down" = tab sticking out from bottom, "up" = slot cut into top
  const d = direction === "down"
    ? `M0 0 H${NOTCH_OFFSET} V${NOTCH_H / 2} Q${NOTCH_OFFSET} ${NOTCH_H} ${NOTCH_OFFSET + NOTCH_W * 0.2} ${NOTCH_H} H${NOTCH_OFFSET + NOTCH_W * 0.8} Q${NOTCH_OFFSET + NOTCH_W} ${NOTCH_H} ${NOTCH_OFFSET + NOTCH_W} ${NOTCH_H / 2} V0 H200`
    : `M0 ${NOTCH_H} H${NOTCH_OFFSET} V${NOTCH_H / 2} Q${NOTCH_OFFSET} 0 ${NOTCH_OFFSET + NOTCH_W * 0.2} 0 H${NOTCH_OFFSET + NOTCH_W * 0.8} Q${NOTCH_OFFSET + NOTCH_W} 0 ${NOTCH_OFFSET + NOTCH_W} ${NOTCH_H / 2} V${NOTCH_H} H200`;
  return (
    <svg width="200" height={NOTCH_H} viewBox={`0 0 200 ${NOTCH_H}`} className="block" style={{ display: "block" }}>
      <path d={d} fill={`${color}15`} stroke={`${color}35`} strokeWidth="1.5" />
    </svg>
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
  const isAI = keyword === "AI";
  const isOutput = keyword === "→ out";

  const [editingField, setEditingField] = useState<string | null>(null);

  function handleFieldChange(fieldName: string, value: string | number) {
    onUpdate({ ...block.fields, [fieldName]: value });
    setEditingField(null);
  }

  // ── Field rendering ────────────────────────────────────────────
  const fieldEls = editing && def ? (
    <div className="ml-auto flex items-center gap-1 px-2 py-1.5">
      {Object.entries(def.fields).map(([fieldName, fieldDef]) => {
        const val = block.fields[fieldName];
        if (editingField === fieldName) {
          const cls = "rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white outline-none";
          const st = { border: `1px solid ${color}60` };
          if (fieldDef.kind === "select") {
            return (
              <select key={fieldName} value={String(val)} onChange={(e) => handleFieldChange(fieldName, e.target.value)} onBlur={() => setEditingField(null)} autoFocus className={cls} style={st}>
                {fieldDef.options.map((o) => <option key={o.value} value={o.value} className="bg-[#0d1727]">{o.label}</option>)}
              </select>
            );
          }
          if (fieldDef.kind === "number") {
            return <input key={fieldName} type="number" value={val} min={fieldDef.min} max={fieldDef.max} step={fieldDef.step ?? 1} onChange={(e) => handleFieldChange(fieldName, Number(e.target.value))} onBlur={() => setEditingField(null)} onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }} autoFocus className={`${cls} w-14`} style={st} />;
          }
          return <input key={fieldName} type="text" value={String(val)} onChange={(e) => handleFieldChange(fieldName, e.target.value)} onBlur={() => setEditingField(null)} onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }} autoFocus className={`${cls} w-20`} style={st} />;
        }
        return (
          <button key={fieldName} onClick={(e) => { e.stopPropagation(); setEditingField(fieldName); }} onPointerDown={(e) => e.stopPropagation()} className="rounded px-1.5 py-0.5 font-mono text-[10px] text-white/60 hover:text-white" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
            {String(val)}
          </button>
        );
      })}
    </div>
  ) : detail ? (
    <div className="ml-auto px-2 py-1.5">
      <span className="rounded px-1.5 py-0.5 font-mono text-[10px] text-white/45" style={{ background: `${color}10` }}>{detail}</span>
    </div>
  ) : null;

  // ── Block body (shared header) ─────────────────────────────────
  const bodyEl = (
    <div
      className="flex items-stretch"
      style={{
        background: `${color}12`,
        borderLeft: `4px solid ${color}`,
        borderRight: `2px solid ${color}30`,
        minHeight: 34,
      }}
    >
      <div className="flex shrink-0 items-center px-2" style={{ background: `${color}18`, borderRight: `1px solid ${color}20`, minWidth: 48 }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isAI ? "#fff" : color }}>{keyword}</span>
      </div>
      <div className="flex items-center px-2 py-1.5">
        <span className="text-[11px] font-semibold text-white/85">{label}</span>
      </div>
      {fieldEls}
      {editing && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} onPointerDown={(e) => e.stopPropagation()} className="shrink-0 px-2 text-[10px] text-white/20 hover:text-red-400">x</button>
      )}
    </div>
  );

  // ── Hat: rounded top, no incoming notch ─────────────────────────
  if (shape === "hat") {
    return (
      <div style={{ marginTop: isFirst ? 0 : -1 }}>
        <div style={{ background: `${color}12`, borderTop: `2px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRight: `2px solid ${color}30`, borderRadius: "10px 10px 0 0", height: 8 }} />
        {bodyEl}
        {!isLast && <NotchPath color={color} direction="down" />}
      </div>
    );
  }

  // ── Cap: no outgoing notch, rounded bottom ─────────────────────
  if (shape === "cap") {
    return (
      <div style={{ marginTop: -1 }}>
        {!isFirst && <NotchPath color={color} direction="up" />}
        {bodyEl}
        <div style={{ background: `${color}12`, borderBottom: `2px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRight: `2px solid ${color}30`, borderRadius: "0 0 10px 10px", height: 8 }} />
      </div>
    );
  }

  // ── C-block: wraps children ─────────────────────────────────────
  if (shape === "cblock") {
    const children = block.children ?? [];

    return (
      <div style={{ marginTop: isFirst ? 0 : -1 }}>
        {!isFirst && <NotchPath color={color} direction="up" />}
        {/* Header */}
        <div style={{ background: `${color}12`, borderTop: `2px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRight: `2px solid ${color}30`, borderRadius: "10px 10px 0 0" }}>
          <div className="flex items-stretch" style={{ minHeight: 34 }}>
            <div className="flex shrink-0 items-center px-2" style={{ background: `${color}18`, borderRight: `1px solid ${color}20`, minWidth: 48 }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{keyword}</span>
            </div>
            <div className="flex items-center px-2 py-1.5">
              <span className="text-[11px] font-semibold text-white/85">{label}</span>
            </div>
            {fieldEls}
            {editing && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} onPointerDown={(e) => e.stopPropagation()} className="shrink-0 px-2 text-[10px] text-white/20 hover:text-red-400">x</button>
            )}
          </div>
          {/* Inner notch for children */}
          <div style={{ paddingLeft: 16 }}>
            <NotchPath color={color} direction="down" />
          </div>
        </div>

        {/* Children area */}
        <div style={{ marginLeft: 16, borderLeft: `4px solid ${color}`, background: `${color}06`, minHeight: 28, paddingTop: 2, paddingBottom: 2 }}>
          {children.length === 0 ? (
            <div className="flex items-center px-3 text-[10px] italic text-white/20" style={{ minHeight: 28 }}>
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
                onUpdate={(fields) => {
                  const next = children.map((c, i) => i === idx ? { ...c, fields } : c);
                  onChildrenChange?.(next);
                }}
                onDelete={() => onChildrenChange?.(children.filter((_, i) => i !== idx))}
                onChildrenChange={(gc) => {
                  const next = children.map((c, i) => i === idx ? { ...c, children: gc } : c);
                  onChildrenChange?.(next);
                }}
              />
            ))
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ borderLeft: `4px solid ${color}`, borderRight: `2px solid ${color}30`, borderBottom: `2px solid ${color}30`, background: `${color}12`, borderRadius: "0 0 10px 10px", paddingLeft: 16 }}>
          <NotchPath color={color} direction="up" />
          <div style={{ height: 6 }} />
        </div>

        {!isLast && <NotchPath color={color} direction="down" />}
      </div>
    );
  }

  // ── Stack (default): both notches ──────────────────────────────
  return (
    <div style={{ marginTop: isFirst ? 0 : -1 }}>
      {!isFirst && <NotchPath color={color} direction="up" />}
      {bodyEl}
      {!isLast && <NotchPath color={color} direction="down" />}
    </div>
  );
}
