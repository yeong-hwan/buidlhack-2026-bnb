import type { BlockCategory } from '../../blocks/base';

interface BlockColors {
  fill: string;
  stroke: string;
  text: string;
}

const COLORS: Record<BlockCategory, BlockColors> = {
  start:     { fill: '#f97316', stroke: '#c2410c', text: '#fff' },
  input:     { fill: '#3b82f6', stroke: '#1d4ed8', text: '#fff' },
  logic:     { fill: '#a855f7', stroke: '#7e22ce', text: '#fff' },
  decision:  { fill: '#eab308', stroke: '#a16207', text: '#000' },
  execution: { fill: '#22c55e', stroke: '#15803d', text: '#fff' },
  risk:      { fill: '#ef4444', stroke: '#b91c1c', text: '#fff' },
};

export function getBlockColors(category: string): BlockColors {
  return COLORS[category as BlockCategory] ?? { fill: '#6b7280', stroke: '#374151', text: '#fff' };
}
