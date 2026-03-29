"use client";

import { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { registerBlocks, TOOLBOXES } from "@/lib/blocks";
import type { StrategyBlock } from "@/app/api/strategy/route";

interface BlocklyEditorProps {
  agentType: "alpha" | "news" | "manager" | "risk";
  blocks: StrategyBlock[];
}

const AGENT_THEME_COLORS: Record<string, string> = {
  alpha: "#22d3ee",
  news: "#a78bfa",
  manager: "#34d399",
  risk: "#fb7185",
};

let blocksRegistered = false;

function buildXml(blocks: StrategyBlock[]): string {
  if (blocks.length === 0) return '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

  let inner = "";
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const fields = Object.entries(b.fields)
      .map(([k, v]) => `<field name="${k}">${v}</field>`)
      .join("");

    if (i === 0) {
      inner += `<block type="${b.type}" x="40" y="40">${fields}`;
    } else {
      inner += `<next><block type="${b.type}">${fields}`;
    }
  }
  for (let i = blocks.length - 1; i > 0; i--) inner += `</block></next>`;
  inner += `</block>`;

  return `<xml xmlns="https://developers.google.com/blockly/xml">${inner}</xml>`;
}

export default function BlocklyEditor({ agentType, blocks }: BlocklyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!blocksRegistered) {
      registerBlocks();
      blocksRegistered = true;
    }
    if (workspaceRef.current) return;

    const accentColor = AGENT_THEME_COLORS[agentType];

    workspaceRef.current = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOXES[agentType],
      grid: { spacing: 32, length: 2, colour: "rgba(255,255,255,0.05)", snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.85, maxScale: 2, minScale: 0.3 },
      move: { scrollbars: { horizontal: true, vertical: true }, drag: true, wheel: true },
      theme: Blockly.Theme.defineTheme(`dark_${agentType}`, {
        name: `dark_${agentType}`,
        base: Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: "#0b1322",
          toolboxBackgroundColour: "#0a1425",
          toolboxForegroundColour: "rgba(255,255,255,0.85)",
          flyoutBackgroundColour: "#0d1a2d",
          flyoutForegroundColour: "rgba(255,255,255,0.75)",
          flyoutOpacity: 1,
          scrollbarColour: `${accentColor}30`,
          scrollbarOpacity: 0.8,
          insertionMarkerColour: accentColor,
          insertionMarkerOpacity: 0.5,
          markerColour: accentColor,
          cursorColour: accentColor,
        },
      }),
      trashcan: true,
      sounds: false,
    });
  }, [agentType]);

  useEffect(() => {
    if (!workspaceRef.current) return;
    const xml = buildXml(blocks);
    const dom = Blockly.utils.xml.textToDom(xml);
    workspaceRef.current.clear();
    Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
  }, [blocks]);

  return <div ref={containerRef} className="h-full w-full" />;
}
