"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentZoneNode, { type AgentZoneData } from "./nodes/AgentZoneNode";
import type { AgentBlocks, StrategyBlock } from "@/app/api/strategy/route";

const NODE_TYPES = { agentZone: AgentZoneNode };

type AgentKey = keyof AgentBlocks;

const AGENT_META: Record<AgentKey, { label: string; color: string; borderColor: string; bgColor: string }> = {
  data:    { label: "Data Feed",    color: "#f59e0b", borderColor: "#f59e0b", bgColor: "rgba(245,158,11,0.04)" },
  alpha:   { label: "Alpha Agent",  color: "#22d3ee", borderColor: "#22d3ee", bgColor: "rgba(34,211,238,0.04)" },
  news:    { label: "News Agent",   color: "#a78bfa", borderColor: "#a78bfa", bgColor: "rgba(167,139,250,0.04)" },
  manager: { label: "Manager",      color: "#34d399", borderColor: "#34d399", bgColor: "rgba(52,211,153,0.04)" },
  risk:    { label: "Risk Agent",   color: "#fb7185", borderColor: "#fb7185", bgColor: "rgba(251,113,133,0.04)" },
};

// DAG topology: data → alpha, alpha → manager, news → manager, manager → risk
const DAG_EDGES: Array<{ source: AgentKey; target: AgentKey }> = [
  { source: "data",    target: "alpha"   },
  { source: "alpha",   target: "manager" },
  { source: "news",    target: "manager" },
  { source: "manager", target: "risk"    },
];

// Assign each agent to a column in the DAG
const COLUMN: Record<AgentKey, number> = {
  data: 0, alpha: 1, news: 1, manager: 2, risk: 3,
};

const COL_X = [0, 360, 720, 1080];
const NODE_W = 280;
const NODE_GAP_Y = 40;
const BLOCK_H = 36; // approx height per block card

function computeLayout(agentBlocks: AgentBlocks) {
  const active = (Object.keys(AGENT_META) as AgentKey[]).filter(
    (k) => (agentBlocks[k]?.length ?? 0) > 0
  );

  // Group active agents by column
  const columns: Map<number, AgentKey[]> = new Map();
  for (const k of active) {
    const col = COLUMN[k];
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(k);
  }

  // Estimate node height for centering
  function nodeHeight(k: AgentKey): number {
    const blockCount = agentBlocks[k]?.length ?? 0;
    return 60 + Math.max(1, blockCount) * BLOCK_H;
  }

  // For each column, stack agents vertically centered around y=0
  const positions: Partial<Record<AgentKey, { x: number; y: number }>> = {};

  // Find which columns are actually used
  const usedCols = [...columns.keys()].sort((a, b) => a - b);

  // Re-index columns to remove gaps
  const colRemap = new Map<number, number>();
  usedCols.forEach((col, idx) => colRemap.set(col, idx));

  for (const [col, agents] of columns) {
    const cx = COL_X[colRemap.get(col)!] ?? col * 360;
    const totalH = agents.reduce((s, k) => s + nodeHeight(k) + NODE_GAP_Y, -NODE_GAP_Y);
    let y = -totalH / 2;
    for (const k of agents) {
      positions[k] = { x: cx, y };
      y += nodeHeight(k) + NODE_GAP_Y;
    }
  }

  // Also include inactive agents but collapsed (tiny) and dimmed
  const allKeys = Object.keys(AGENT_META) as AgentKey[];
  const inactive = allKeys.filter((k) => !active.includes(k));

  // Place inactive in their column but at bottom, below active
  for (const k of inactive) {
    const col = COLUMN[k];
    const cx = COL_X[colRemap.get(col) ?? col] ?? col * 360;
    const colAgents = columns.get(col) ?? [];
    const lastActive = colAgents[colAgents.length - 1];
    const baseY = lastActive ? (positions[lastActive]!.y + nodeHeight(lastActive) + NODE_GAP_Y) : 0;
    positions[k] = { x: cx, y: baseY };
  }

  // Build edges only between active nodes
  const edges: Edge[] = DAG_EDGES
    .filter((e) => active.includes(e.source) && active.includes(e.target))
    .map((e) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: {
        stroke: AGENT_META[e.source].color,
        strokeWidth: 2,
        opacity: 0.6,
      },
    }));

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

  const { positions, edges, active } = useMemo(
    () => computeLayout(agentBlocks),
    [agentBlocks]
  );

  const nodes: Node[] = useMemo(
    () =>
      (Object.keys(AGENT_META) as AgentKey[]).map((key) => {
        const meta = AGENT_META[key];
        const isActive = active.includes(key);
        const data: AgentZoneData = {
          ...meta,
          agentKey: key,
          blocks: agentBlocks[key] ?? [],
          onBlocksChange: handleBlocksChange,
        };
        return {
          id: key,
          type: "agentZone",
          position: positions[key] ?? { x: 0, y: 0 },
          data,
          draggable: true,
          style: isActive ? undefined : { opacity: 0.35, transform: "scale(0.85)" },
        };
      }),
    [agentBlocks, handleBlocksChange, positions, active]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.35 }}
      minZoom={0.3}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(255,255,255,0.07)" />
    </ReactFlow>
  );
}
