'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { computeCanvasLayout } from '../../layout/engine';
import { getBlockSpec } from '../../blocks/registry';
import { BlockRenderer } from './BlockRenderer';
import { screenToWorld } from '../../blocks/document';
import { findBestSnap, shiftLayout, generateEdgeId } from '../../snap/engine';

interface Props {
  debugAnchors?: boolean;
}

interface DragState {
  blockId: string;
  /** block world position at drag start */
  startX: number;
  startY: number;
  /** screen position at drag start */
  screenStartX: number;
  screenStartY: number;
}

export function BlockCanvas({ debugAnchors }: Props) {
  const document = useDocumentStore((s) => s.document);
  const updateBlockPosition = useDocumentStore((s) => s.updateBlockPosition);
  const removeBlock = useDocumentStore((s) => s.removeBlock);
  const addEdge = useDocumentStore((s) => s.addEdge);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Drag state
  const dragState = useRef<DragState | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Pan state
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const panOrigin = useRef({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Compute all block layouts
  const baseLayouts = useMemo(() => computeCanvasLayout(document), [document]);

  // Current layouts (with drag override applied)
  const currentLayouts = useMemo(() => {
    if (!dragState.current || (dragOffset.x === 0 && dragOffset.y === 0)) return baseLayouts;
    const { blockId } = dragState.current;
    const base = baseLayouts[blockId];
    if (!base) return baseLayouts;
    return {
      ...baseLayouts,
      [blockId]: shiftLayout(base, dragOffset.x, dragOffset.y),
    };
  }, [baseLayouts, dragOffset]);

  // Snap target during drag
  const snapResult = useMemo(() => {
    if (!dragState.current) return null;
    const { blockId } = dragState.current;
    const draggingLayout = currentLayouts[blockId];
    if (!draggingLayout) return null;
    return findBestSnap(draggingLayout, currentLayouts, document);
  }, [currentLayouts, document]);

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.25, Math.min(4, z * delta)));
  }, []);

  // ── Block drag ─────────────────────────────────────────────────────────────
  const handleBlockPointerDown = useCallback(
    (e: React.PointerEvent, blockId: string) => {
      e.stopPropagation();
      const node = document.blocks[blockId];
      if (!node) return;

      setSelectedId(blockId);
      dragState.current = {
        blockId,
        startX: node.x,
        startY: node.y,
        screenStartX: e.clientX,
        screenStartY: e.clientY,
      };
      setDragOffset({ x: 0, y: 0 });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    [document.blocks],
  );

  // ── Canvas pan ─────────────────────────────────────────────────────────────
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (dragState.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = pan;
      setSelectedId(null);
    },
    [pan],
  );

  // ── Pointer move (drag or pan) ─────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragState.current) {
        // Block drag
        const dxScreen = e.clientX - dragState.current.screenStartX;
        const dyScreen = e.clientY - dragState.current.screenStartY;
        setDragOffset({ x: dxScreen / zoom, y: dyScreen / zoom });
        return;
      }

      if (panStart.current) {
        // Canvas pan
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
      }
    },
    [zoom],
  );

  // ── Pointer up (commit drag or end pan) ────────────────────────────────────
  const handlePointerUp = useCallback(() => {
    if (dragState.current) {
      const { blockId, startX, startY } = dragState.current;

      // Final position
      let finalX = startX + dragOffset.x;
      let finalY = startY + dragOffset.y;

      // Apply snap alignment
      if (snapResult) {
        finalX += snapResult.dx;
        finalY += snapResult.dy;

        // Create edge
        const edgeId = generateEdgeId(
          snapResult.fromAnchor.blockId,
          snapResult.fromAnchor.portName,
          snapResult.toAnchor.blockId,
          snapResult.toAnchor.portName,
        );
        addEdge({
          id: edgeId,
          from: { blockId: snapResult.fromAnchor.blockId, port: snapResult.fromAnchor.portName },
          to:   { blockId: snapResult.toAnchor.blockId,   port: snapResult.toAnchor.portName },
        });
      }

      updateBlockPosition(blockId, finalX, finalY);
      dragState.current = null;
      setDragOffset({ x: 0, y: 0 });
    }

    panStart.current = null;
  }, [dragOffset, snapResult, updateBlockPosition, addEdge]);

  // ── Delete key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Avoid deleting while typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        if (selectedId) {
          removeBlock(selectedId);
          setSelectedId(null);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, removeBlock]);

  // ── Orphan detection ───────────────────────────────────────────────────────
  const blocks = Object.values(document.blocks);
  const connectedIds = useMemo(() => {
    const hatIds = blocks
      .filter((b) => ['every_interval', 'when_signal_received', 'when_news_arrives', 'manual_run'].includes(b.type))
      .map((b) => b.id);

    const visited = new Set<string>(hatIds);
    const queue = [...hatIds];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const edge of document.edges) {
        if (edge.from.blockId === id && !visited.has(edge.to.blockId)) {
          visited.add(edge.to.blockId);
          queue.push(edge.to.blockId);
        }
      }
      const block = document.blocks[id];
      if (block?.children) {
        for (const childIds of Object.values(block.children)) {
          for (const cid of childIds) {
            if (!visited.has(cid)) { visited.add(cid); queue.push(cid); }
          }
        }
      }
    }
    return visited;
  }, [blocks, document]);

  const isDragging = !!dragState.current;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a1a2e]">
      {/* Dot grid */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
            x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
            <circle cx={0} cy={0} r={0.5} fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main SVG canvas */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {document.edges.map((edge) => {
            const fromLayout = currentLayouts[edge.from.blockId];
            const toLayout = currentLayouts[edge.to.blockId];
            if (!fromLayout || !toLayout) return null;
            const fa = fromLayout.portAnchors[edge.from.port];
            const ta = toLayout.portAnchors[edge.to.port];
            if (!fa || !ta) return null;
            const my = (fa.y + ta.y) / 2;
            return (
              <path
                key={edge.id}
                d={`M ${fa.x} ${fa.y} C ${fa.x} ${my} ${ta.x} ${my} ${ta.x} ${ta.y}`}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1.5 / zoom}
                fill="none"
              />
            );
          })}

          {/* Snap highlight ring */}
          {snapResult && (
            <circle
              cx={snapResult.toAnchor.x}
              cy={snapResult.toAnchor.y}
              r={10}
              fill="none"
              stroke="#fff"
              strokeWidth={2 / zoom}
              opacity={0.8}
            />
          )}

          {/* Blocks */}
          {blocks.map((node) => {
            const layout = currentLayouts[node.id];
            if (!layout) return null;
            const spec = getBlockSpec(node.type);
            const isOrphan = blocks.length > 1 && !connectedIds.has(node.id);
            const isThisDragging = dragState.current?.blockId === node.id;

            return (
              <g
                key={node.id}
                style={{ cursor: 'move', filter: isThisDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' : undefined }}
                onPointerDown={(e) => handleBlockPointerDown(e, node.id)}
              >
                <BlockRenderer
                  node={node}
                  layout={layout}
                  spec={spec}
                  debugAnchors={debugAnchors}
                  selected={selectedId === node.id}
                  orphan={isOrphan && !isThisDragging}
                  onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Delete hint */}
      {selectedId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-white/40 bg-black/40 px-2 py-1 rounded pointer-events-none">
          Delete 키로 삭제
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-white/40">
        <button className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setZoom((z) => Math.max(0.25, z * 0.9))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setZoom((z) => Math.min(4, z * 1.1))}>+</button>
        <button className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors ml-2"
          onClick={() => { setZoom(1); setPan({ x: 60, y: 60 }); }}>⌖</button>
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
