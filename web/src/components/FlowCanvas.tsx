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
import type { AgentBlocks } from "@/app/api/strategy/route";

const NODE_TYPES = { agentZone: AgentZoneNode };

const AGENT_META = {
  alpha:   { label: "Alpha Agent",  color: "#22d3ee", borderColor: "#22d3ee", bgColor: "rgba(34,211,238,0.04)" },
  news:    { label: "News Agent",   color: "#a78bfa", borderColor: "#a78bfa", bgColor: "rgba(167,139,250,0.04)" },
  manager: { label: "Manager",      color: "#34d399", borderColor: "#34d399", bgColor: "rgba(52,211,153,0.04)" },
  risk:    { label: "Risk Agent",   color: "#fb7185", borderColor: "#fb7185", bgColor: "rgba(251,113,133,0.04)" },
};

// DAG layout: alpha + news → manager → risk
const POSITIONS = {
  alpha:   { x: 60,  y: 40  },
  news:    { x: 60,  y: 320 },
  manager: { x: 420, y: 180 },
  risk:    { x: 780, y: 180 },
};

const STATIC_EDGES: Edge[] = [
  {
    id: "alpha-manager",
    source: "alpha",
    target: "manager",
    animated: true,
    style: { stroke: "#22d3ee", strokeWidth: 2, opacity: 0.6 },
  },
  {
    id: "news-manager",
    source: "news",
    target: "manager",
    animated: true,
    style: { stroke: "#a78bfa", strokeWidth: 2, opacity: 0.6 },
  },
  {
    id: "manager-risk",
    source: "manager",
    target: "risk",
    animated: true,
    style: { stroke: "#34d399", strokeWidth: 2, opacity: 0.6 },
  },
];

interface FlowCanvasProps {
  agentBlocks: AgentBlocks;
  onExpandAgent: (agentKey: string) => void;
}

export default function FlowCanvas({ agentBlocks, onExpandAgent }: FlowCanvasProps) {
  const handleExpand = useCallback(
    (key: string) => onExpandAgent(key),
    [onExpandAgent]
  );

  const nodes: Node[] = useMemo(
    () =>
      (Object.keys(AGENT_META) as Array<keyof typeof AGENT_META>).map((key) => {
        const meta = AGENT_META[key];
        const data: AgentZoneData = {
          ...meta,
          agentKey: key,
          blocks: agentBlocks[key] ?? [],
          onExpand: handleExpand,
        };
        return {
          id: key,
          type: "agentZone",
          position: POSITIONS[key],
          data,
          draggable: true,
        };
      }),
    [agentBlocks, handleExpand]
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
      <Background
        variant={BackgroundVariant.Dots}
        gap={32}
        size={1}
        color="rgba(255,255,255,0.07)"
      />
    </ReactFlow>
  );
}
