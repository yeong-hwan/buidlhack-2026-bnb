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

const AGENT_META = {
  data:    { label: "Data Feed",    color: "#f59e0b", borderColor: "#f59e0b", bgColor: "rgba(245,158,11,0.04)" },
  alpha:   { label: "Alpha Agent",  color: "#22d3ee", borderColor: "#22d3ee", bgColor: "rgba(34,211,238,0.04)" },
  news:    { label: "News Agent",   color: "#a78bfa", borderColor: "#a78bfa", bgColor: "rgba(167,139,250,0.04)" },
  manager: { label: "Manager",      color: "#34d399", borderColor: "#34d399", bgColor: "rgba(52,211,153,0.04)" },
  risk:    { label: "Risk Agent",   color: "#fb7185", borderColor: "#fb7185", bgColor: "rgba(251,113,133,0.04)" },
};

const POSITIONS = {
  data:    { x: -280, y: 180 },
  alpha:   { x: 80,   y: 40  },
  news:    { x: 80,   y: 340 },
  manager: { x: 440,  y: 190 },
  risk:    { x: 800,  y: 190 },
};

const STATIC_EDGES: Edge[] = [
  { id: "data-alpha",    source: "data",    target: "alpha",   animated: true, style: { stroke: "#f59e0b", strokeWidth: 2, opacity: 0.6 } },
  { id: "alpha-manager", source: "alpha",   target: "manager", animated: true, style: { stroke: "#22d3ee", strokeWidth: 2, opacity: 0.6 } },
  { id: "news-manager",  source: "news",    target: "manager", animated: true, style: { stroke: "#a78bfa", strokeWidth: 2, opacity: 0.6 } },
  { id: "manager-risk",  source: "manager", target: "risk",    animated: true, style: { stroke: "#34d399", strokeWidth: 2, opacity: 0.6 } },
];

interface FlowCanvasProps {
  agentBlocks: AgentBlocks;
  onBlocksChange: (agentKey: string, blocks: StrategyBlock[]) => void;
}

export default function FlowCanvas({ agentBlocks, onBlocksChange }: FlowCanvasProps) {
  const handleBlocksChange = useCallback(
    (agentKey: string, blocks: StrategyBlock[]) => onBlocksChange(agentKey, blocks),
    [onBlocksChange]
  );

  const nodes: Node[] = useMemo(
    () =>
      (Object.keys(AGENT_META) as Array<keyof typeof AGENT_META>).map((key) => {
        const meta = AGENT_META[key];
        const data: AgentZoneData = {
          ...meta,
          agentKey: key,
          blocks: agentBlocks[key] ?? [],
          onBlocksChange: handleBlocksChange,
        };
        return {
          id: key,
          type: "agentZone",
          position: POSITIONS[key],
          data,
          draggable: true,
        };
      }),
    [agentBlocks, handleBlocksChange]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={STATIC_EDGES}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.3}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(255,255,255,0.07)" />
    </ReactFlow>
  );
}
