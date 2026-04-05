"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { getBlockDef } from "@/lib/blockRegistry";

export type BlockNodeData = {
  blockType: string;
  fields: Record<string, string | number>;
  color: string;
  onFieldChange: (nodeId: string, fields: Record<string, string | number>) => void;
  onDelete: (nodeId: string) => void;
};

function BlockNode({ id, data }: NodeProps) {
  const d = data as BlockNodeData;
  const def = getBlockDef(d.blockType);
  const shape = def?.shape ?? "stack";
  const keyword = def?.keyword ?? d.blockType.split("_")[0];
  const label = def?.label ?? d.blockType.split("_").slice(1).join(" ");
  const color = d.color;

  const bg     = `${color}40`;
  const bgDark = `${color}60`;

  const [editingField, setEditingField] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  function handleFieldChange(fn: string, v: string | number) {
    d.onFieldChange(id, { ...d.fields, [fn]: v });
    setEditingField(null);
  }

  const topR  = shape === "hat" || shape === "cblock" ? "10px" : "4px";
  const botR  = shape === "cap" ? "10px" : "4px";

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: bg,
        borderRadius: `${topR} ${topR} ${botR} ${botR}`,
        boxShadow: `inset 0 -3px 0 ${bgDark}, 0 2px 8px rgba(0,0,0,0.3)`,
        minWidth: 180,
        maxWidth: 280,
        position: "relative",
      }}
    >
      {/* Main body */}
      <div className="flex items-center gap-1" style={{ padding: "7px 0", minHeight: 38 }}>
        {/* Keyword badge */}
        <div
          className="flex shrink-0 items-center justify-center self-stretch px-2.5"
          style={{
            background: bgDark,
            borderRadius: `${topR} 0 0 ${botR}`,
            minWidth: 50,
          }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
            {keyword}
          </span>
        </div>

        {/* Label */}
        <span className="px-1 text-[11px] font-bold text-white">{label}</span>

        {/* Fields */}
        <div className="ml-auto flex flex-wrap items-center gap-1 pr-2">
          {def && Object.entries(def.fields).map(([fieldName, fieldDef]) => {
            const val = d.fields[fieldName];
            if (editingField === fieldName) {
              const cls = "rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white outline-none";
              const st = { border: `1.5px solid ${color}` };
              if (fieldDef.kind === "select") {
                return (
                  <select key={fieldName} value={String(val)} onChange={(e) => handleFieldChange(fieldName, e.target.value)} onBlur={() => setEditingField(null)} autoFocus className={cls} style={st} onPointerDown={(e) => e.stopPropagation()}>
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
              <button key={fieldName} onClick={() => setEditingField(fieldName)} onPointerDown={(e) => e.stopPropagation()}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white/90"
                style={{ background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.15)" }}
              >
                {String(val ?? "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Delete button on hover */}
      {hovering && (
        <button
          onClick={() => d.onDelete(id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-[10px] font-bold text-white hover:bg-red-500"
        >
          x
        </button>
      )}

      {/* Handles — top/left for input, bottom/right for output */}
      {shape !== "hat" && (
        <Handle type="target" position={Position.Top} style={{ background: color, border: "2px solid #0b1322", width: 10, height: 10, top: -5 }} />
      )}
      {shape !== "cap" && (
        <Handle type="source" position={Position.Bottom} style={{ background: color, border: "2px solid #0b1322", width: 10, height: 10, bottom: -5 }} />
      )}
    </div>
  );
}

export default memo(BlockNode);
