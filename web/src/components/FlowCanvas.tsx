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

const COL_SPACING = 400;
const NODE_GAP_Y = 60;
const BLOCK_H = 44;

function computeLayout(agentBlocks: AgentBlocks) {
  const allKeys = Object.keys(AGENT_META) as AgentKey[];
  const active = allKeys.filter((k) => (agentBlocks[k]?.length ?? 0) > 0);

  function nodeHeight(k: AgentKey): number {
    const blockCount = agentBlocks[k]?.length ?? 0;
    return blockCount > 0 ? 70 + blockCount * BLOCK_H : 90;
  }

  // Fixed positions per agent — always placed, never overlapping
  // Column 0: data, Column 1: alpha + news, Column 2: manager, Column 3: risk
  const positions: Record<AgentKey, { x: number; y: number }> = {
    data:    { x: 0,                y: 0 },
    alpha:   { x: COL_SPACING,      y: 0 },
    news:    { x: COL_SPACING,      y: 0 },
    manager: { x: COL_SPACING * 2,  y: 0 },
    risk:    { x: COL_SPACING * 3,  y: 0 },
  };

  // Stack alpha + news vertically in column 1
  const alphaH = nodeHeight("alpha");
  const newsH = nodeHeight("news");
  const col1Total = alphaH + NODE_GAP_Y + newsH;
  positions.alpha.y = -col1Total / 2;
  positions.news.y = positions.alpha.y + alphaH + NODE_GAP_Y;

  // Center single-agent columns with col1
  const col1Center = positions.alpha.y + col1Total / 2;
  positions.data.y = col1Center - nodeHeight("data") / 2;
  positions.manager.y = col1Center - nodeHeight("manager") / 2;
  positions.risk.y = col1Center - nodeHeight("risk") / 2;

  // Edges: always show between active, plus dimmed edges for inactive
  const edges: Edge[] = DAG_EDGES
    .filter((e) => active.includes(e.source) || active.includes(e.target))
    .map((e) => {
      const bothActive = active.includes(e.source) && active.includes(e.target);
      return {
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: bothActive,
        style: {
          stroke: AGENT_META[e.source].color,
          strokeWidth: bothActive ? 2 : 1,
          opacity: bothActive ? 0.6 : 0.15,
        },
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
          position: positions[key],
          data,
          draggable: true,
          style: isActive ? undefined : { opacity: 0.3 },
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
