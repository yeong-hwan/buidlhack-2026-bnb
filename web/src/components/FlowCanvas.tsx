"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type EdgeProps,
  type OnNodesChange,
  type OnEdgesChange,
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

// Signal edge
function SignalEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 20 });
  const label = (data as Record<string, unknown>)?.signalLabel as string | undefined;
  const COLORS: Record<string, string> = { BUY: "#34d399", SELL: "#fb7185", BULLISH: "#34d399", BEARISH: "#fb7185", RISK_ON: "#34d399", RISK_OFF: "#fb7185" };
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "none" }}>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ color: COLORS[label] ?? "#94a3b8", background: "rgba(8,17,31,0.85)" }}>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const EDGE_TYPES = { signal: SignalEdge };

const DAG_LINKS: [AgentKey, AgentKey][] = [["data", "alpha"], ["alpha", "manager"], ["news", "manager"], ["manager", "risk"]];
const COL_SPACING = 380;
const ROW_GAP = 50;
const BLOCK_H = 48;

function getSignalLabel(blocks: StrategyBlock[], emitType: string): string | null {
  const e = blocks.find((b) => b.type === emitType);
  return e ? String(e.fields.SIGNAL ?? "") : null;
}

function buildInitialLayout(agentBlocks: AgentBlocks, callbacks: { onBlocksChange: AgentZoneData["onBlocksChange"] }): { nodes: Node[]; edges: Edge[] } {
  const allKeys = Object.keys(AGENT_META) as AgentKey[];
  const active = allKeys.filter((k) => (agentBlocks[k]?.length ?? 0) > 0);
  const errors = validateStrategy(agentBlocks);

  const COL: Record<AgentKey, number> = { data: 0, alpha: 1, news: 1, manager: 2, risk: 3 };
  function nh(k: AgentKey) { return 56 + Math.max(1, agentBlocks[k]?.length ?? 0) * BLOCK_H; }

  const aH = nh("alpha"), nH = nh("news");
  const col1 = aH + ROW_GAP + nH;
  const aY = -col1 / 2, nY = aY + aH + ROW_GAP;
  const ctr = aY + col1 / 2;

  const pos: Record<AgentKey, { x: number; y: number }> = {
    data:    { x: 0,                y: ctr - nh("data") / 2 },
    alpha:   { x: COL_SPACING,      y: aY },
    news:    { x: COL_SPACING,      y: nY },
    manager: { x: COL_SPACING * 2,  y: ctr - nh("manager") / 2 },
    risk:    { x: COL_SPACING * 3,  y: ctr - nh("risk") / 2 },
  };

  const emitMap: Record<string, string | null> = {
    data: getSignalLabel(agentBlocks.data ?? [], "feed_emit"),
    alpha: getSignalLabel(agentBlocks.alpha ?? [], "alpha_emit_signal"),
    news: getSignalLabel(agentBlocks.news ?? [], "news_emit_signal"),
  };

  const nodes: Node[] = allKeys.map((key) => {
    const meta = AGENT_META[key];
    const isActive = active.includes(key);
    const data: AgentZoneData = {
      ...meta, agentKey: key,
      blocks: agentBlocks[key] ?? [],
      errors: errors.filter((e) => e.agent === key),
      onBlocksChange: callbacks.onBlocksChange,
    };
    return {
      id: key, type: "agentZone", position: pos[key], data,
      draggable: true, dragHandle: ".zone-drag-handle",
      style: isActive ? undefined : { opacity: 0.25 },
    };
  });

  const COLORS: Record<string, string> = { BUY: "#34d399", SELL: "#fb7185", BULLISH: "#34d399", BEARISH: "#fb7185", RISK_ON: "#34d399", RISK_OFF: "#fb7185" };
  const edges: Edge[] = DAG_LINKS
    .filter(([s, t]) => active.includes(s) || active.includes(t))
    .map(([s, t]) => {
      const both = active.includes(s) && active.includes(t);
      const sig = emitMap[s] ?? null;
      const sc = both && sig ? (COLORS[sig] ?? AGENT_META[s].color) : AGENT_META[s].color;
      return { id: `${s}-${t}`, source: s, target: t, type: "signal" as const, animated: both, data: { signalLabel: both ? sig : null }, style: { stroke: sc, strokeWidth: both ? 2 : 1, opacity: both ? 0.6 : 0.12 } };
    });

  return { nodes, edges };
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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
  const initialized = useRef(false);

  // Rebuild nodes when agentBlocks change, but PRESERVE user-dragged positions
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildInitialLayout(agentBlocks, { onBlocksChange: handleBlocksChange });

    if (!initialized.current) {
      setNodes(newNodes);
      setEdges(newEdges);
      initialized.current = true;
    } else {
      // Update data (blocks, errors) but keep existing positions
      setNodes((prev) =>
        newNodes.map((nn) => {
          const existing = prev.find((p) => p.id === nn.id);
          return existing ? { ...nn, position: existing.position } : nn;
        })
      );
      setEdges(newEdges);
    }
  }, [agentBlocks, handleBlocksChange, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      fitView={!initialized.current}
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.2}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
    </ReactFlow>
  );
}
