"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentZoneNode, { type AgentZoneData } from "./nodes/AgentZoneNode";
import type { AgentBlocks, StrategyBlock } from "@/app/api/strategy/route";
import { validateStrategy } from "@/lib/blockValidator";

const NODE_TYPES = { agentZone: AgentZoneNode };

type AgentKey = keyof AgentBlocks;

const AGENT_META: Record<AgentKey, { label: string; color: string; borderColor: string; bgColor: string }> = {
  data:    { label: "Data Feed",    color: "#f59e0b", borderColor: "#f59e0b", bgColor: "rgba(245,158,11,0.04)" },
  alpha:   { label: "Alpha Agent",  color: "#22d3ee", borderColor: "#22d3ee", bgColor: "rgba(34,211,238,0.04)" },
  news:    { label: "News Agent",   color: "#a78bfa", borderColor: "#a78bfa", bgColor: "rgba(167,139,250,0.04)" },
  manager: { label: "Manager",      color: "#34d399", borderColor: "#34d399", bgColor: "rgba(52,211,153,0.04)" },
  risk:    { label: "Risk Agent",   color: "#fb7185", borderColor: "#fb7185", bgColor: "rgba(251,113,133,0.04)" },
};

// Signal-labeled edge
function SignalEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    borderRadius: 20,
  });
  const label = (data as Record<string, unknown>)?.signalLabel as string | undefined;
  const SIGNAL_COLORS: Record<string, string> = {
    BUY: "#34d399", SELL: "#fb7185", HOLD: "#f59e0b",
    BULLISH: "#34d399", BEARISH: "#fb7185", NEUTRAL: "#94a3b8",
    RISK_ON: "#34d399", RISK_OFF: "#fb7185",
  };
  const labelColor = label ? (SIGNAL_COLORS[label] ?? "#94a3b8") : undefined;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "none" }}>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ color: labelColor, background: "rgba(8,17,31,0.8)" }}>
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const EDGE_TYPES = { signal: SignalEdge };

// DAG connections
const DAG_EDGES: Array<{ source: AgentKey; target: AgentKey }> = [
  { source: "data", target: "alpha" },
  { source: "alpha", target: "manager" },
  { source: "news", target: "manager" },
  { source: "manager", target: "risk" },
];

const BLOCK_H = 48;
const COL_SPACING = 380;
const ROW_GAP = 50;

function getSignalLabel(blocks: StrategyBlock[], emitType: string): string | null {
  const emit = blocks.find((b) => b.type === emitType);
  return emit ? String(emit.fields.SIGNAL ?? "") : null;
}

function computeLayout(agentBlocks: AgentBlocks) {
  const allKeys = Object.keys(AGENT_META) as AgentKey[];
  const active = allKeys.filter((k) => (agentBlocks[k]?.length ?? 0) > 0);

  function nodeHeight(k: AgentKey): number {
    return 56 + Math.max(1, agentBlocks[k]?.length ?? 0) * BLOCK_H;
  }

  // Column assignments
  const COL: Record<AgentKey, number> = { data: 0, alpha: 1, news: 1, manager: 2, risk: 3 };

  // Stack alpha + news vertically
  const alphaH = nodeHeight("alpha");
  const newsH = nodeHeight("news");
  const col1Total = alphaH + ROW_GAP + newsH;
  const alphaY = -col1Total / 2;
  const newsY = alphaY + alphaH + ROW_GAP;
  const center = alphaY + col1Total / 2;

  const positions: Record<AgentKey, { x: number; y: number }> = {
    data:    { x: COL.data * COL_SPACING,    y: center - nodeHeight("data") / 2 },
    alpha:   { x: COL.alpha * COL_SPACING,   y: alphaY },
    news:    { x: COL.news * COL_SPACING,    y: newsY },
    manager: { x: COL.manager * COL_SPACING, y: center - nodeHeight("manager") / 2 },
    risk:    { x: COL.risk * COL_SPACING,    y: center - nodeHeight("risk") / 2 },
  };

  // Edges with signals
  const emitMap: Record<string, string | null> = {
    data:  getSignalLabel(agentBlocks.data ?? [], "feed_emit"),
    alpha: getSignalLabel(agentBlocks.alpha ?? [], "alpha_emit_signal"),
    news:  getSignalLabel(agentBlocks.news ?? [], "news_emit_signal"),
  };

  const edges: Edge[] = DAG_EDGES
    .filter((e) => active.includes(e.source) || active.includes(e.target))
    .map((e) => {
      const both = active.includes(e.source) && active.includes(e.target);
      const sig = emitMap[e.source] ?? null;
      const SIGNAL_COLORS: Record<string, string> = { BUY: "#34d399", SELL: "#fb7185", BULLISH: "#34d399", BEARISH: "#fb7185", RISK_ON: "#34d399", RISK_OFF: "#fb7185" };
      const strokeColor = both && sig ? (SIGNAL_COLORS[sig] ?? AGENT_META[e.source as AgentKey].color) : AGENT_META[e.source as AgentKey].color;

      return {
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: "signal",
        animated: both,
        data: { signalLabel: both ? sig : null },
        style: { stroke: strokeColor, strokeWidth: both ? 2 : 1, opacity: both ? 0.6 : 0.12 },
      };
    });

  return { positions, edges, active };
}

interface FlowCanvasProps {
  agentBlocks: AgentBlocks;
  onBlocksChange: (agentKey: string, blocks: StrategyBlock[]) => void;
}

export default function FlowCanvas({ agentBlocks, onBlocksChange }: FlowCanvasProps) {
  const handleBlocksChange = useCallback(
    (agentKey: string, blocks: StrategyBlock[]) => onBlocksChange(agentKey, blocks),
    [onBlocksChange]
  );

  const { positions, edges, active } = useMemo(() => computeLayout(agentBlocks), [agentBlocks]);
  const allErrors = useMemo(() => validateStrategy(agentBlocks), [agentBlocks]);

  const nodes: Node[] = useMemo(
    () =>
      (Object.keys(AGENT_META) as AgentKey[]).map((key) => {
        const meta = AGENT_META[key];
        const isActive = active.includes(key);
        const data: AgentZoneData = {
          ...meta,
          agentKey: key,
          blocks: agentBlocks[key] ?? [],
          errors: allErrors.filter((e) => e.agent === key),
          onBlocksChange: handleBlocksChange,
        };
        return {
          id: key,
          type: "agentZone",
          position: positions[key],
          data,
          draggable: true,
          dragHandle: ".zone-drag-handle",
          style: isActive ? undefined : { opacity: 0.25 },
        };
      }),
    [agentBlocks, handleBlocksChange, positions, active, allErrors]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.2}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
    </ReactFlow>
  );
}
