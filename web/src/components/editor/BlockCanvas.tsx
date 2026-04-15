'use client';

import { useCallback, useRef, useState, useMemo } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { computeCanvasLayout } from '../../layout/engine';
import { getBlockSpec } from '../../blocks/registry';
import { BlockRenderer } from './BlockRenderer';
import { screenToWorld } from '../../blocks/document';

interface Props {
  debugAnchors?: boolean;
}

export function BlockCanvas({ debugAnchors }: Props) {
  const document = useDocumentStore((s) => s.document);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pan drag state
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const panOrigin = useRef({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Compute all block layouts (memoized)
  const layouts = useMemo(() => computeCanvasLayout(document), [document]);

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.25, Math.min(4, z * delta)));
    },
    [],
  );

  // ── Pan ──────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only pan on background (not on a block)
      if ((e.target as Element).closest('[data-block]')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = pan;
    },
    [pan],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!panStart.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    panStart.current = null;
  }, []);

  const blocks = Object.values(document.blocks);

  // Check which blocks are "orphans" (not reachable from any hat block)
  // Simplified: any block not connected via edges to a hat block
  const connectedIds = useMemo(() => {
    const hatIds = blocks
      .filter((b) => b.type === 'every_interval' || b.type === 'when_signal_received'
        || b.type === 'when_news_arrives' || b.type === 'manual_run')
      .map((b) => b.id);

    const visited = new Set<string>(hatIds);
    const queue = [...hatIds];

    while (queue.length > 0) {
      const id = queue.shift()!;
      // Follow edges
      for (const edge of document.edges) {
        if (edge.from.blockId === id && !visited.has(edge.to.blockId)) {
          visited.add(edge.to.blockId);
          queue.push(edge.to.blockId);
        }
      }
      // Follow children
      const block = document.blocks[id];
      if (block?.children) {
        for (const childIds of Object.values(block.children)) {
          for (const cid of childIds) {
            if (!visited.has(cid)) {
              visited.add(cid);
              queue.push(cid);
            }
          }
        }
      }
    }
    return visited;
  }, [blocks, document]);

  return (
    <div className="relative flex-1 overflow-hidden bg-[#1a1a2e]">
      {/* Grid background */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
            x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
            <circle cx={0} cy={0} r={0.5} fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main canvas SVG */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: 'grab' }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {blocks.map((node) => {
            const layout = layouts[node.id];
            if (!layout) return null;
            const spec = getBlockSpec(node.type);
            const isOrphan = blocks.length > 1 && !connectedIds.has(node.id);

            return (
              <g key={node.id} data-block={node.id}>
                <BlockRenderer
                  node={node}
                  layout={layout}
                  spec={spec}
                  debugAnchors={debugAnchors}
                  selected={selectedId === node.id}
                  orphan={isOrphan}
                  onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
                />
              </g>
            );
          })}

          {/* Edges */}
          {document.edges.map((edge) => {
            const fromLayout = layouts[edge.from.blockId];
            const toLayout = layouts[edge.to.blockId];
            if (!fromLayout || !toLayout) return null;

            const fromAnchor = fromLayout.portAnchors[edge.from.port];
            const toAnchor = toLayout.portAnchors[edge.to.port];
            if (!fromAnchor || !toAnchor) return null;

            const mx = (fromAnchor.x + toAnchor.x) / 2;
            const my = (fromAnchor.y + toAnchor.y) / 2;

            return (
              <path
                key={edge.id}
                d={`M ${fromAnchor.x} ${fromAnchor.y} C ${fromAnchor.x} ${my} ${toAnchor.x} ${my} ${toAnchor.x} ${toAnchor.y}`}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1.5}
                fill="none"
                strokeDasharray="4 2"
              />
            );
          })}
        </g>
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-white/40">
        <button
          className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setZoom((z) => Math.max(0.25, z * 0.9))}
        >
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setZoom((z) => Math.min(4, z * 1.1))}
        >
          +
        </button>
        <button
          className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors ml-2"
          onClick={() => { setZoom(1); setPan({ x: 60, y: 60 }); }}
        >
          ⌖
        </button>
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white/20">
            <div className="text-4xl mb-3">+</div>
            <div className="text-sm">팔레트에서 블록을 추가하세요</div>
          </div>
        </div>
      )}
    </div>
  );
}
