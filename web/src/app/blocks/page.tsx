"use client";

import BlockCard from "@/components/BlockCard";
import { BLOCK_REGISTRY, type BlockDefinition } from "@/lib/blockRegistry";

const AGENTS = [
  {
    key: "data",
    label: "Data Feed",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.25)",
    desc: "외부 시장 데이터 수신 — 매크로/온체인 신호 입력층. RISK_ON / RISK_OFF 신호를 내려보냄.",
    role: "입력 (Trigger → Emit)",
  },
  {
    key: "alpha",
    label: "Alpha Agent",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.06)",
    border: "rgba(34,211,238,0.25)",
    desc: "가격·거래량·모멘텀 분석 — BUY / SELL / HOLD 신호를 Manager에 전달.",
    role: "분석 (Trigger → Decide → Emit)",
  },
  {
    key: "news",
    label: "News Agent",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.25)",
    desc: "뉴스·소셜 감성 분석 — BULLISH / BEARISH 신호를 Manager에 전달.",
    role: "감성 (Trigger → Filter → Emit)",
  },
  {
    key: "manager",
    label: "Manager",
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.25)",
    desc: "신호를 받아 실제 온체인 주문 실행 — 매수/매도/DCA/리밸런싱.",
    role: "실행 (On Signal → Action)",
  },
  {
    key: "risk",
    label: "Risk Agent",
    color: "#fb7185",
    bg: "rgba(251,113,133,0.06)",
    border: "rgba(251,113,133,0.25)",
    desc: "손실 방어 가드레일 — 손절/익절/포지션 한도/일일 손실 제한.",
    role: "방어 (Guards)",
  },
] as const;

const SHAPE_META: Record<string, { label: string; desc: string; color: string }> = {
  hat:    { label: "HAT",    desc: "트리거 — 스택 최상단 필수",      color: "#fbbf24" },
  stack:  { label: "STACK",  desc: "액션/필터 — 중간 어디든 가능",   color: "#60a5fa" },
  cblock: { label: "C-BLOCK",desc: "반복/조건 — 내부에 블록 포함",   color: "#f97316" },
  cap:    { label: "CAP",    desc: "출력 — 스택 최하단 필수",        color: "#a3e635" },
};

const VALIDATION_RULES = [
  { icon: "🔴", rule: "HAT 블록이 맨 위가 아닐 때", severity: "warning" },
  { icon: "🔴", rule: "CAP 블록이 맨 아래가 아닐 때", severity: "warning" },
  { icon: "🔴", rule: "첫 블록이 HAT/CBLOCK이 아닐 때", severity: "warning" },
  { icon: "🟡", rule: "Data/Alpha/News에 emit 블록 없음 → 신호 미전달", severity: "warning" },
  { icon: "🟡", rule: "Manager에 on_alpha/on_news/on_data/schedule 없이 액션 블록만 있을 때", severity: "warning" },
  { icon: "🟡", rule: "Manager가 있는데 Alpha/News 에이전트 없음", severity: "warning" },
  { icon: "🔴", rule: "Manager가 있는데 Risk 에이전트 비어있음", severity: "error" },
];

function ShapePill({ shape }: { shape: string }) {
  const m = SHAPE_META[shape];
  if (!m) return null;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
      style={{ background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}40` }}
    >
      {m.label}
    </span>
  );
}

function BlockRow({ def, agentColor }: { def: BlockDefinition; agentColor: string }) {
  const mockBlock = { type: def.type, fields: { ...def.defaults } };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      {/* Preview */}
      <div className="w-64 shrink-0">
        <BlockCard
          block={mockBlock}
          color={agentColor}
          isFirst
          isLast
          editing={false}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </div>
      {/* Meta */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-2">
          <ShapePill shape={def.shape} />
          <code className="text-[10px] text-white/30">{def.type}</code>
        </div>
        <p className="text-[11px] text-white/60">{def.detail(def.defaults)}</p>
      </div>
    </div>
  );
}

export default function BlocksPage() {
  const total = BLOCK_REGISTRY.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#08111f] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Block Catalog</h1>
          <p className="mt-1 text-sm text-white/40">전체 {total}개 블록 · 5개 에이전트 — 검수용 임시 페이지</p>
        </div>

        {/* Shape legend */}
        <div className="mb-8 grid grid-cols-4 gap-3">
          {Object.entries(SHAPE_META).map(([shape, m]) => (
            <div key={shape} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <ShapePill shape={shape} />
              <p className="mt-1.5 text-[10px] text-white/50">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Validation rules */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/70">검증 규칙 (컴파일러)</h2>
          <div className="flex flex-col gap-1.5">
            {VALIDATION_RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span>{r.icon}</span>
                <span className={r.severity === "error" ? "text-red-300" : "text-amber-300"}>{r.rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent sections */}
        {AGENTS.map((agent) => {
          const blocks = BLOCK_REGISTRY.filter((b) => b.agent === agent.key);
          return (
            <div key={agent.key} className="mb-10">
              {/* Agent header */}
              <div
                className="mb-4 rounded-2xl px-5 py-4"
                style={{ background: agent.bg, border: `1px solid ${agent.border}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: agent.color, boxShadow: `0 0 8px ${agent.color}` }} />
                    <span className="font-bold tracking-wide" style={{ color: agent.color }}>{agent.label.toUpperCase()}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/30">{blocks.length} blocks</span>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px]"
                    style={{ background: `${agent.color}15`, color: `${agent.color}cc`, border: `1px solid ${agent.color}30` }}
                  >
                    {agent.role}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-white/50">{agent.desc}</p>
              </div>

              {/* Block list */}
              <div className="flex flex-col gap-2">
                {blocks.map((def) => (
                  <BlockRow key={def.type} def={def} agentColor={agent.color} />
                ))}
              </div>
            </div>
          );
        })}

        <p className="mt-4 text-center text-[10px] text-white/20">이 페이지는 검수용입니다. 배포 전 /blocks 경로를 제거하거나 유지하세요.</p>
      </div>
    </div>
  );
}
