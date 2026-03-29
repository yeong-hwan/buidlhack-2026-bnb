"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export type AgentZoneData = {
  label: string;
  agentKey: string;
  color: string;
  borderColor: string;
  bgColor: string;
  blocks: Array<{ type: string; fields: Record<string, string | number> }>;
  onExpand: (agentKey: string) => void;
};

// Block display metadata: [keyword, description, field summary fn]
type BlockMeta = {
  keyword: string;
  label: string;
  detail: (fields: Record<string, string | number>) => string;
};

const BLOCK_META: Record<string, BlockMeta> = {
  alpha_when_momentum:   { keyword: "when",   label: "momentum",       detail: (f) => `${f.DIRECTION} threshold · ${f.PERIOD}d` },
  alpha_when_price:      { keyword: "when",   label: "price",          detail: (f) => `${f.TOKEN} ${f.OPERATOR} ${f.VALUE} USDT` },
  alpha_when_volume:     { keyword: "when",   label: "volume",         detail: (f) => `> ${f.MULTIPLIER}× avg` },
  alpha_if:              { keyword: "if",     label: "condition",      detail: () => "then →" },
  alpha_emit_signal:     { keyword: "emit",   label: "signal",         detail: (f) => `${f.SIGNAL} · ${f.STRENGTH}%` },
  news_when_sentiment:   { keyword: "when",   label: "sentiment",      detail: (f) => `${f.SENTIMENT}` },
  news_when_keyword:     { keyword: "when",   label: "keyword",        detail: (f) => `"${f.KEYWORD}"` },
  news_if:               { keyword: "if",     label: "condition",      detail: () => "then →" },
  news_emit_signal:      { keyword: "emit",   label: "news signal",    detail: (f) => `${f.SIGNAL}` },
  mgr_on_signal:         { keyword: "on",     label: "signal",         detail: (f) => `${f.SIGNAL}` },
  mgr_buy:               { keyword: "buy",    label: "token",          detail: (f) => `${f.AMOUNT} USDT → ${f.TOKEN}` },
  mgr_sell:              { keyword: "sell",   label: "token",          detail: (f) => `${f.AMOUNT_PCT}% of ${f.TOKEN}` },
  mgr_dca:               { keyword: "dca",    label: "order",          detail: (f) => `${f.AMOUNT} USDT · ${f.INTERVAL}` },
  mgr_rebalance:         { keyword: "rebal",  label: "portfolio",      detail: (f) => `${f.TOKEN} → ${f.TARGET_PCT}%` },
  mgr_repeat:            { keyword: "repeat", label: "every",          detail: (f) => `${f.N} ${f.UNIT}` },
  mgr_if:                { keyword: "if",     label: "condition",      detail: () => "then / else" },
  risk_set_stop_loss:    { keyword: "stop",   label: "loss",           detail: (f) => `−${f.PCT}% exit` },
  risk_set_take_profit:  { keyword: "take",   label: "profit",         detail: (f) => `+${f.PCT}% exit` },
  risk_max_position:     { keyword: "max",    label: "position",       detail: (f) => `${f.MAX_USDT} USDT` },
  risk_max_drawdown:     { keyword: "if",     label: "drawdown",       detail: (f) => `> ${f.PCT}% → pause` },
  risk_daily_loss_limit: { keyword: "daily",  label: "loss limit",     detail: (f) => `${f.LIMIT_USDT} USDT` },
};

// Notch SVG for Scratch-like block connector
function TopNotch({ color }: { color: string }) {
  return (
    <svg width="24" height="8" viewBox="0 0 24 8" className="absolute -top-[8px] left-6" style={{ overflow: "visible" }}>
      <path d="M0 8 L4 8 L4 4 Q4 0 8 0 L16 0 Q20 0 20 4 L20 8 L24 8" fill={color} stroke="none" />
    </svg>
  );
}

function BottomNotch({ color }: { color: string }) {
  return (
    <svg width="24" height="8" viewBox="0 0 24 8" className="absolute -bottom-[8px] left-6" style={{ overflow: "visible" }}>
      <path d="M0 0 L4 0 L4 4 Q4 8 8 8 L16 8 Q20 8 20 4 L20 0 L24 0" fill={color} stroke="none" />
    </svg>
  );
}

function BlockCard({
  block,
  color,
  isFirst,
  isLast,
}: {
  block: { type: string; fields: Record<string, string | number> };
  color: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const meta = BLOCK_META[block.type];
  const keyword = meta?.keyword ?? block.type.split("_")[0];
  const label   = meta?.label   ?? block.type.split("_").slice(1).join(" ");
  const detail  = meta?.detail(block.fields) ?? "";

  return (
    <div className="relative" style={{ marginTop: isFirst ? 0 : -1 }}>
      {/* Scratch-style block body */}
      <div
        className="relative flex items-center gap-0 overflow-hidden rounded-md"
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
        <div className="flex flex-1 items-center justify-between gap-2 px-2.5 py-1.5">
          <span className="text-[11px] font-medium text-white/80">{label}</span>
          {detail && (
            <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
              {detail}
            </span>
          )}
        </div>
      </div>

      {/* Connector dots between blocks */}
      {!isLast && (
        <div className="mx-auto flex justify-center py-0.5">
          <div className="h-3 w-px" style={{ background: `${color}40` }} />
        </div>
      )}
    </div>
  );
}

function AgentZoneNode({ data }: NodeProps) {
  const d = data as AgentZoneData;

  return (
    <div
      className="relative flex flex-col rounded-2xl backdrop-blur-sm"
      style={{
        width: 280,
        minHeight: 120,
        border: `1px solid ${d.borderColor}45`,
        background: d.bgColor,
        boxShadow: `0 0 50px ${d.borderColor}15, inset 0 0 30px ${d.borderColor}05`,
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
          onMouseDown={(e) => { e.stopPropagation(); d.onExpand(d.agentKey); }}
          className="rounded px-2 py-0.5 text-[10px] text-white/30 hover:bg-white/10 hover:text-white/60"
        >
          Open editor ›
        </button>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-0 p-3">
        {d.blocks.length === 0 ? (
          <div
            className="rounded-md border border-dashed px-3 py-4 text-center text-[11px]"
            style={{ borderColor: `${d.borderColor}25`, color: `${d.color}40` }}
          >
            drop blocks here
          </div>
        ) : (
          d.blocks.map((b, i) => (
            <BlockCard
              key={i}
              block={b}
              color={d.color}
              isFirst={i === 0}
              isLast={i === d.blocks.length - 1}
            />
          ))
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
