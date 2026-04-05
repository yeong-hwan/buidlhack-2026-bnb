"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BlockNode, { type BlockNodeData } from "./nodes/BlockNode";
import { getBlockDef } from "@/lib/blockRegistry";
import type { AgentBlocks, StrategyBlock } from "@/app/api/strategy/route";

const NODE_TYPES = { block: BlockNode };

type AgentKey = keyof AgentBlocks;

const AGENT_COLORS: Record<string, string> = {
  data:    "#f59e0b",
  alpha:   "#22d3ee",
  news:    "#a78bfa",
  manager: "#34d399",
  risk:    "#fb7185",
};

// Column layout for auto-positioning
const AGENT_COL: Record<string, number> = {
  data: 0, alpha: 1, news: 1, manager: 2, risk: 3,
};
const AGENT_ROW_OFFSET: Record<string, number> = {
  data: 0, alpha: -1, news: 1, manager: 0, risk: 0,
};

const COL_SPACING = 320;
const ROW_SPACING = 80;
const BLOCK_HEIGHT = 60;

// Custom signal edge
function SignalEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge id={id} path={edgePath} style={style} />;
}

const EDGE_TYPES = { signal: SignalEdge };

// Convert AgentBlocks to canvas nodes + edges
function agentBlocksToCanvas(
  agentBlocks: AgentBlocks,
  onFieldChange: (nodeId: string, fields: Record<string, string | number>) => void,
  onDelete: (nodeId: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const emitNodes: Record<string, string> = {}; // agent → nodeId of emit block
  const receiveNodes: Record<string, string> = {}; // agent → nodeId of first block

  for (const [agentKey, blocks] of Object.entries(agentBlocks) as [AgentKey, StrategyBlock[]][]) {
    if (!blocks || blocks.length === 0) continue;
    const color = AGENT_COLORS[agentKey] ?? "#888";
    const col = AGENT_COL[agentKey] ?? 0;
    const rowOffset = AGENT_ROW_OFFSET[agentKey] ?? 0;

    blocks.forEach((block, idx) => {
      const nodeId = `${agentKey}-${idx}`;
      const x = col * COL_SPACING + 50;
      const y = rowOffset * ROW_SPACING * 2 + idx * BLOCK_HEIGHT + 50;

      const data: BlockNodeData = {
        blockType: block.type,
        fields: block.fields,
        color,
        onFieldChange,
        onDelete,
      };

      nodes.push({
        id: nodeId,
        type: "block",
        position: { x, y },
        data,
        draggable: true,
      });

      // Connect blocks within same agent (sequential)
      if (idx > 0) {
        edges.push({
          id: `${agentKey}-${idx - 1}-${idx}`,
          source: `${agentKey}-${idx - 1}`,
          target: nodeId,
          type: "signal",
          animated: false,
          style: { stroke: color, strokeWidth: 2, opacity: 0.5 },
        });
      }

      // Track emit and receive blocks for cross-agent edges
      if (block.type.includes("emit") || block.type === "feed_emit") {
        emitNodes[agentKey] = nodeId;
      }
      if (idx === 0) {
        receiveNodes[agentKey] = nodeId;
      }
    });
  }

  // Cross-agent edges: data→alpha, alpha→manager, news→manager, manager→risk
  const crossLinks: [string, string][] = [
    ["data", "alpha"],
    ["alpha", "manager"],
    ["news", "manager"],
    ["manager", "risk"],
  ];

  for (const [from, to] of crossLinks) {
    const sourceId = emitNodes[from];
    const targetId = receiveNodes[to];
    if (sourceId && targetId) {
      edges.push({
        id: `cross-${from}-${to}`,
        source: sourceId,
        target: targetId,
        type: "signal",
        animated: true,
        style: {
          stroke: AGENT_COLORS[from],
          strokeWidth: 2.5,
          opacity: 0.7,
          strokeDasharray: "8 4",
        },
      });
    }
  }

  return { nodes, edges };
}

interface FlowCanvasProps {
  agentBlocks: AgentBlocks;
  onBlocksChange: (agentKey: string, blocks: StrategyBlock[]) => void;
}

export default function FlowCanvas({ agentBlocks, onBlocksChange }: FlowCanvasProps) {
  const handleFieldChange = useCallback((nodeId: string, fields: Record<string, string | number>) => {
    const [agentKey, idxStr] = nodeId.split("-");
    const idx = parseInt(idxStr);
    const blocks = [...(agentBlocks[agentKey as AgentKey] ?? [])];
    if (blocks[idx]) {
      blocks[idx] = { ...blocks[idx], fields };
      onBlocksChange(agentKey, blocks);
    }
  }, [agentBlocks, onBlocksChange]);

  const handleDelete = useCallback((nodeId: string) => {
    const [agentKey, idxStr] = nodeId.split("-");
    const idx = parseInt(idxStr);
    const blocks = (agentBlocks[agentKey as AgentKey] ?? []).filter((_, i) => i !== idx);
    onBlocksChange(agentKey, blocks);
  }, [agentBlocks, onBlocksChange]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => agentBlocksToCanvas(agentBlocks, handleFieldChange, handleDelete),
    [agentBlocks, handleFieldChange, handleDelete]
  );

  return (
    <ReactFlow
      nodes={initialNodes}
      edges={initialEdges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.4 }}
      minZoom={0.2}
      maxZoom={3}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "signal" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />

      {/* Agent labels as background annotations */}
      <AgentLabels agentBlocks={agentBlocks} />
    </ReactFlow>
  );
}

// Floating agent labels behind blocks
function AgentLabels({ agentBlocks }: { agentBlocks: AgentBlocks }) {
  const labels: Record<string, string> = {
    data: "DATA FEED", alpha: "ALPHA", news: "NEWS", manager: "MANAGER", risk: "RISK",
  };

  return (
    <>
      {(Object.entries(agentBlocks) as [AgentKey, StrategyBlock[]][]).map(([key, blocks]) => {
        if (!blocks || blocks.length === 0) return null;
        const col = AGENT_COL[key] ?? 0;
        const rowOffset = AGENT_ROW_OFFSET[key] ?? 0;
        const x = col * COL_SPACING + 50;
        const y = rowOffset * ROW_SPACING * 2 + 20;
        const color = AGENT_COLORS[key];

        return (
          <div
            key={key}
            className="react-flow__panel"
            style={{
              position: "absolute",
              left: x,
              top: y,
              color: `${color}30`,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.15em",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: -1,
            }}
          >
            {labels[key]}
          </div>
        );
      })}
    </>
  );
}
