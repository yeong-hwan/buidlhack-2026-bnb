"use client";

import { useState } from "react";
import { getBlockDef } from "@/lib/blockRegistry";

interface BlockCardProps {
  block: { type: string; fields: Record<string, string | number> };
  color: string;
  isLast: boolean;
  editing: boolean;
  onUpdate: (fields: Record<string, string | number>) => void;
  onDelete: () => void;
}

export default function BlockCard({ block, color, isLast, editing, onUpdate, onDelete }: BlockCardProps) {
  const def = getBlockDef(block.type);
  const keyword = def?.keyword ?? block.type.split("_")[0];
  const label   = def?.label   ?? block.type.split("_").slice(1).join(" ");
  const detail  = def?.detail(block.fields) ?? "";

  const [editingField, setEditingField] = useState<string | null>(null);

  function handleFieldChange(fieldName: string, value: string | number) {
    onUpdate({ ...block.fields, [fieldName]: value });
    setEditingField(null);
  }

  return (
    <div className="relative">
      <div
        className="group relative flex items-center gap-0 overflow-hidden rounded-md"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderLeft: `3px solid ${color}`,
        }}
      >
        {/* Keyword pill */}
        <div
          className="shrink-0 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color, background: `${color}20`, borderRight: `1px solid ${color}30` }}
        >
          {keyword}
        </div>

        {/* Label + detail */}
        <div className="flex flex-1 items-center justify-between gap-1 px-2 py-1.5">
          <span className="text-[11px] font-medium text-white/80">{label}</span>

          {editing && def ? (
            <div className="flex items-center gap-1">
              {Object.entries(def.fields).map(([fieldName, fieldDef]) => {
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
                        className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white outline-none"
                        style={{ borderColor: `${color}50` }}
                      >
                        {fieldDef.options.map((o) => (
                          <option key={o.value} value={o.value} className="bg-[#0d1727] text-white">
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
                        className="w-16 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white outline-none"
                      />
                    );
                  }
                  if (fieldDef.kind === "text") {
                    return (
                      <input
                        key={fieldName}
                        type="text"
                        value={String(val)}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }}
                        autoFocus
                        className="w-24 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white outline-none"
                      />
                    );
                  }
                }

                return (
                  <button
                    key={fieldName}
                    onClick={(e) => { e.stopPropagation(); setEditingField(fieldName); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50 hover:bg-white/10 hover:text-white/80"
                    title={`Edit ${fieldName}`}
                  >
                    {String(val)}
                  </button>
                );
              })}
            </div>
          ) : (
            detail && (
              <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
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
            className="shrink-0 px-2 py-1.5 text-[10px] text-white/20 hover:text-red-400"
          >
            ×
          </button>
        )}
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className="mx-auto flex justify-center py-0.5">
          <div className="h-3 w-px" style={{ background: `${color}40` }} />
        </div>
      )}
    </div>
  );
}
