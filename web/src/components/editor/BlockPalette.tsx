'use client';

import { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { getBlockColors } from './blockColors';
import type { BlockType } from '../../blocks/data';

interface BlockEntry {
  type: BlockType;
  label: string;
}

const PALETTE_GROUPS: { category: string; label: string; blocks: BlockEntry[] }[] = [
  {
    category: 'start',
    label: 'Start',
    blocks: [
      { type: 'every_interval',       label: 'Every Interval' },
      { type: 'when_signal_received', label: 'When Signal' },
      { type: 'when_news_arrives',    label: 'When News' },
      { type: 'manual_run',           label: 'Manual Run' },
    ],
  },
  {
    category: 'input',
    label: 'Input',
    blocks: [
      { type: 'price_of',      label: 'Price of' },
      { type: 'change_pct_of', label: 'Change %' },
      { type: 'volume_of',     label: 'Volume of' },
      { type: 'rsi_of',        label: 'RSI' },
      { type: 'ma_of',         label: 'MA' },
      { type: 'sentiment_of',  label: 'Sentiment' },
      { type: 'position_info', label: 'Position' },
      { type: 'portfolio_info',label: 'Portfolio' },
    ],
  },
  {
    category: 'logic',
    label: 'Logic',
    blocks: [
      { type: 'if',            label: 'If' },
      { type: 'if_else',       label: 'If / Else' },
      { type: 'and',           label: 'And' },
      { type: 'or',            label: 'Or' },
      { type: 'not',           label: 'Not' },
      { type: 'compare',       label: 'Compare' },
      { type: 'between',       label: 'Between' },
      { type: 'keyword_match', label: 'Keyword Match' },
    ],
  },
  {
    category: 'decision',
    label: 'Decision',
    blocks: [
      { type: 'emit_signal',           label: 'Emit Signal' },
      { type: 'score_signal',          label: 'Score Signal' },
      { type: 'confirm_for_n_intervals', label: 'Confirm N×' },
      { type: 'consensus',             label: 'Consensus' },
    ],
  },
  {
    category: 'execution',
    label: 'Execution',
    blocks: [
      { type: 'buy_market',      label: 'Buy Market' },
      { type: 'sell_market',     label: 'Sell Market' },
      { type: 'close_position',  label: 'Close Position' },
      { type: 'pause_strategy',  label: 'Pause Strategy' },
      { type: 'resume_strategy', label: 'Resume Strategy' },
    ],
  },
  {
    category: 'risk',
    label: 'Risk',
    blocks: [
      { type: 'set_stop_loss',       label: 'Stop Loss' },
      { type: 'set_take_profit',     label: 'Take Profit' },
      { type: 'max_position_size',   label: 'Max Position' },
      { type: 'cooldown_after_loss', label: 'Cooldown' },
      { type: 'kill_switch',         label: 'Kill Switch' },
    ],
  },
];

interface Props {
  /** pan + zoom to compute world coords for new blocks */
  getCanvasCenter: () => { x: number; y: number };
}

export function BlockPalette({ getCanvasCenter }: Props) {
  const addBlockByType = useDocumentStore((s) => s.addBlockByType);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function addBlock(type: BlockType) {
    const { x, y } = getCanvasCenter();
    addBlockByType(type, x, y);
  }

  return (
    <aside className="w-52 shrink-0 overflow-y-auto bg-[#111827] border-r border-white/10 flex flex-col">
      <div className="px-3 py-3 border-b border-white/10">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">Blocks</div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {PALETTE_GROUPS.map(({ category, label, blocks }) => {
          const colors = getBlockColors(category);
          const isCollapsed = collapsed[category];

          return (
            <div key={category} className="mb-1">
              {/* Category header */}
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors"
                onClick={() => toggle(category)}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: colors.fill }}
                />
                <span className="text-xs font-semibold text-white/70 flex-1 text-left">{label}</span>
                <span className="text-white/30 text-xs">{isCollapsed ? '›' : '‹'}</span>
              </button>

              {/* Block list */}
              {!isCollapsed && (
                <div className="pl-4 pr-2 pb-1 flex flex-col gap-0.5">
                  {blocks.map(({ type, label: bLabel }) => (
                    <button
                      key={type}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                      onClick={() => addBlock(type)}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: colors.fill }}
                      />
                      {bLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Block count indicator */}
      <div className="px-3 py-2 border-t border-white/10 text-xs text-white/30">
        34 blocks total
      </div>
    </aside>
  );
}
