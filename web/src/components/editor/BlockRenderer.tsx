'use client';

import type { BlockNode } from '../../blocks/document';
import type { BlockLayout } from '../../layout/types';
import type { BlockSpec } from '../../blocks/base';
import { getBlockColors } from './blockColors';
import { hatPath, stackPath, hexPath, capsulePath, cBlockPath } from './shapePaths';
import {
  BLOCK_WIDTH, HAT_HEIGHT, STACK_HEIGHT, BOOLEAN_HEIGHT, VALUE_HEIGHT, VALUE_WIDTH,
  CBLOCK_HEADER_HEIGHT, CBLOCK_FOOTER_HEIGHT,
} from '../../layout/constants';

interface Props {
  node: BlockNode;
  layout: BlockLayout;
  spec: BlockSpec;
  /** Show port anchor dots for debug */
  debugAnchors?: boolean;
  selected?: boolean;
  orphan?: boolean;
  onClick?: () => void;
}

export function BlockRenderer({ node, layout, spec, debugAnchors, selected, orphan, onClick }: Props) {
  const colors = getBlockColors(spec.category);
  const { x, y, width, height } = layout;

  // Compute shape path
  const shapePath = getShapePath(spec, layout);

  const opacity = orphan ? 0.4 : 1;
  const strokeWidth = selected ? 3 : 1.5;
  const strokeColor = selected ? '#fff' : colors.stroke;

  // Label text: humanize block type
  const label = humanizeType(node.type);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer', opacity }}
      onClick={onClick}
    >
      {/* Block shape */}
      <path
        d={shapePath}
        fill={colors.fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Label */}
      <BlockLabel label={label} spec={spec} width={width} height={height} textColor={colors.text} />

      {/* C-block cavity placeholder (when empty) */}
      {spec.shape === 'c-block' && Object.entries(layout.childCavities).map(([slot, cavity]) => {
        // Cavity is at world coords — convert to local
        const cavLocalY = cavity.y - y;
        const cavLocalX = cavity.x - x;
        return (
          <rect
            key={slot}
            x={cavLocalX}
            y={cavLocalY}
            width={cavity.width}
            height={cavity.height}
            fill="rgba(0,0,0,0.15)"
            rx={3}
          />
        );
      })}

      {/* Debug: port anchor dots */}
      {debugAnchors && Object.values(layout.portAnchors).map((anchor) => (
        <circle
          key={anchor.portName}
          cx={anchor.x - x}
          cy={anchor.y - y}
          r={4}
          fill={getRoleColor(anchor.role)}
          opacity={0.8}
        />
      ))}
    </g>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getShapePath(spec: BlockSpec, layout: BlockLayout): string {
  const { width, height } = layout;

  switch (spec.shape) {
    case 'hat':
      return hatPath(BLOCK_WIDTH, HAT_HEIGHT);

    case 'stack':
      return stackPath(BLOCK_WIDTH, STACK_HEIGHT);

    case 'boolean':
      return hexPath(BLOCK_WIDTH, BOOLEAN_HEIGHT);

    case 'value':
      return capsulePath(VALUE_WIDTH, VALUE_HEIGHT);

    case 'c-block': {
      // Derive cavity height from total height
      const cavH = height - CBLOCK_HEADER_HEIGHT - CBLOCK_FOOTER_HEIGHT;
      return cBlockPath(BLOCK_WIDTH, CBLOCK_HEADER_HEIGHT, cavH, CBLOCK_FOOTER_HEIGHT);
    }
  }
}

function BlockLabel({
  label, spec, width, height, textColor,
}: {
  label: string;
  spec: BlockSpec;
  width: number;
  height: number;
  textColor: string;
}) {
  // For C-block, label is in the header area
  const textY = spec.shape === 'c-block'
    ? CBLOCK_HEADER_HEIGHT / 2
    : height / 2;

  return (
    <text
      x={width / 2}
      y={textY}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
      fill={textColor}
      style={{ userSelect: 'none', pointerEvents: 'none' }}
    >
      {label}
    </text>
  );
}

function humanizeType(type: string): string {
  return type.replace(/_/g, ' ');
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'statement-in':
    case 'statement-out': return '#9ca3af';
    case 'boolean-in':
    case 'boolean-out':   return '#60a5fa';
    case 'value-in':
    case 'value-out':     return '#4ade80';
    case 'trigger-out':   return '#fb923c';
    case 'child-slot':    return '#f9a8d4';
    default:              return '#ffffff';
  }
}
