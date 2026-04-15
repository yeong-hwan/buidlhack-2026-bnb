'use client';

import { useCallback, useRef, useState } from 'react';
import { BlockCanvas } from './BlockCanvas';
import { BlockPalette } from './BlockPalette';
import { screenToWorld } from '../../blocks/document';

export function StrategyEditor() {
  const [debugAnchors, setDebugAnchors] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Expose zoom/pan to palette so new blocks appear at canvas center
  const [zoom] = useState(1);
  const [pan] = useState({ x: 60, y: 60 });

  const getCanvasCenter = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return { x: 300, y: 200 };
    const rect = el.getBoundingClientRect();
    return screenToWorld(
      { x: rect.width / 2, y: rect.height / 2 },
      zoom,
      pan,
    );
  }, [zoom, pan]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left palette */}
      <BlockPalette getCanvasCenter={getCanvasCenter} />

      {/* Canvas area */}
      <div ref={canvasRef} className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-10 shrink-0 flex items-center gap-3 px-4 border-b border-white/10 bg-[#0f172a]">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Strategy Editor</span>
          <div className="flex-1" />
          <button
            className={`text-xs px-2 py-1 rounded transition-colors ${debugAnchors ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-white/40 hover:text-white/70'}`}
            onClick={() => setDebugAnchors((d) => !d)}
          >
            Anchors
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <BlockCanvas debugAnchors={debugAnchors} />
        </div>
      </div>
    </div>
  );
}
