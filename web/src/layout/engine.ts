/**
 * Layout Engine — world 좌표 기반 블록 레이아웃 계산.
 *
 * DOM 측정 일절 없음. 순수 수학 함수.
 * 입력: BlockNode + BlockSpec (+ 선택적 cavity 높이)
 * 출력: BlockLayout (portAnchors world 좌표, childCavities)
 *
 * C-block 자동 확장:
 *   computeBlockLayout에 cavityHeights를 넘기면 해당 높이로 cavity 계산.
 *   넘기지 않으면 CBLOCK_CAVITY_MIN_HEIGHT 사용.
 *
 * computeCanvasLayout:
 *   document 전체를 bottom-up으로 순회해 모든 BlockLayout을 한번에 계산.
 */
import type { BlockNode, PortRole, StrategyDocument } from '../blocks/document';
import type { BlockSpec } from '../blocks/base';
import { getBlockSpec } from '../blocks/registry';
import type { BlockLayout, CavityLayout, PortAnchor } from './types';
import {
  BLOCK_WIDTH,
  HAT_HEIGHT,
  STACK_HEIGHT,
  BOOLEAN_HEIGHT,
  VALUE_HEIGHT,
  VALUE_WIDTH,
  CBLOCK_HEADER_HEIGHT,
  CBLOCK_FOOTER_HEIGHT,
  CBLOCK_CAVITY_MIN_HEIGHT,
  CBLOCK_CAVITY_PADDING,
  CBLOCK_CAVITY_INDENT,
  PORT_ANCHOR_SIZE,
} from './constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function anchor(
  blockId: string,
  portName: string,
  role: PortRole,
  x: number,
  y: number,
): PortAnchor {
  return { blockId, portName, role, x, y, width: PORT_ANCHOR_SIZE, height: PORT_ANCHOR_SIZE };
}

// ── Per-shape layout ──────────────────────────────────────────────────────────

function layoutHat(node: BlockNode, spec: BlockSpec): BlockLayout {
  const { id, x, y } = node;
  const width = BLOCK_WIDTH;
  const height = HAT_HEIGHT;
  const portAnchors: Record<string, PortAnchor> = {};

  for (const port of spec.outputPorts) {
    if (port.kind === 'trigger') {
      portAnchors[port.name] = anchor(id, port.name, 'trigger-out', x + width / 2, y + height);
    } else if (port.kind === 'statement') {
      portAnchors[port.name] = anchor(id, port.name, 'statement-out', x + width / 2, y + height);
    }
  }
  // hat 블록은 statement-in(prev) 없음

  return { id, x, y, width, height, portAnchors, childCavities: {} };
}

function layoutStack(node: BlockNode, spec: BlockSpec): BlockLayout {
  const { id, x, y } = node;
  const width = BLOCK_WIDTH;
  const height = STACK_HEIGHT;
  const portAnchors: Record<string, PortAnchor> = {};

  // value-in ports: 블록 내부 우측에 균등 배치
  const valueIns = spec.inputPorts.filter((p) => p.kind === 'value');
  valueIns.forEach((port, i) => {
    const portY = y + (height / (valueIns.length + 1)) * (i + 1);
    portAnchors[port.name] = anchor(id, port.name, 'value-in', x + width - 16, portY);
  });

  for (const port of spec.inputPorts) {
    if (port.kind === 'statement') {
      portAnchors[port.name] = anchor(id, port.name, 'statement-in', x + width / 2, y);
    }
  }
  for (const port of spec.outputPorts) {
    if (port.kind === 'statement') {
      portAnchors[port.name] = anchor(id, port.name, 'statement-out', x + width / 2, y + height);
    }
  }

  return { id, x, y, width, height, portAnchors, childCavities: {} };
}

function layoutBoolean(node: BlockNode, spec: BlockSpec): BlockLayout {
  const { id, x, y } = node;
  const width = BLOCK_WIDTH;
  const height = BOOLEAN_HEIGHT;
  const portAnchors: Record<string, PortAnchor> = {};

  // value-in 포트: 좌→우 순서로 배치
  const valueIns = spec.inputPorts.filter((p) => p.kind === 'value');
  const step = width / (valueIns.length + 1);
  valueIns.forEach((port, i) => {
    portAnchors[port.name] = anchor(id, port.name, 'value-in', x + step * (i + 1), y + height / 2);
  });

  // boolean-in 포트
  const boolIns = spec.inputPorts.filter((p) => p.kind === 'boolean');
  const bStep = width / (boolIns.length + 1);
  boolIns.forEach((port, i) => {
    portAnchors[port.name] = anchor(id, port.name, 'boolean-in', x + bStep * (i + 1), y + height / 2);
  });

  // boolean-out (result): 오른쪽 중앙
  for (const port of spec.outputPorts) {
    if (port.kind === 'boolean') {
      portAnchors[port.name] = anchor(id, port.name, 'boolean-out', x + width, y + height / 2);
    }
  }

  return { id, x, y, width, height, portAnchors, childCavities: {} };
}

function layoutValue(node: BlockNode, spec: BlockSpec): BlockLayout {
  const { id, x, y } = node;
  const width = VALUE_WIDTH;
  const height = VALUE_HEIGHT;
  const portAnchors: Record<string, PortAnchor> = {};

  // value-out: 오른쪽 중앙
  for (const port of spec.outputPorts) {
    if (port.kind === 'value') {
      portAnchors[port.name] = anchor(id, port.name, 'value-out', x + width, y + height / 2);
    }
  }
  // value 블록은 statement 포트 없음

  return { id, x, y, width, height, portAnchors, childCavities: {} };
}

function layoutCBlock(
  node: BlockNode,
  spec: BlockSpec,
  cavityHeights: Record<string, number>,
): BlockLayout {
  const { id, x, y } = node;
  const width = BLOCK_WIDTH;
  const portAnchors: Record<string, PortAnchor> = {};
  const childCavities: Record<string, CavityLayout> = {};
  const slots = spec.childSlots ?? [];

  let cavityY = y + CBLOCK_HEADER_HEIGHT;
  let totalCavityHeight = 0;

  for (const slot of slots) {
    const contentH = Math.max(cavityHeights[slot.name] ?? 0, CBLOCK_CAVITY_MIN_HEIGHT);
    const cavH = contentH + CBLOCK_CAVITY_PADDING * 2;

    const cavity: CavityLayout = {
      x: x + CBLOCK_CAVITY_INDENT,
      y: cavityY + CBLOCK_CAVITY_PADDING,
      width: width - CBLOCK_CAVITY_INDENT * 2,
      height: contentH,
      insertionPoints: [cavityY + CBLOCK_CAVITY_PADDING], // 초기엔 상단 1개
    };
    childCavities[slot.name] = cavity;

    // child-slot anchor: cavity 상단 중앙
    portAnchors[`slot_${slot.name}`] = anchor(
      id,
      `slot_${slot.name}`,
      'child-slot',
      x + width / 2,
      cavityY + CBLOCK_CAVITY_PADDING,
    );

    totalCavityHeight += cavH;
    cavityY += cavH;
  }

  const height = CBLOCK_HEADER_HEIGHT + totalCavityHeight + CBLOCK_FOOTER_HEIGHT;

  // statement-in (prev): 상단 중앙
  for (const port of spec.inputPorts) {
    if (port.kind === 'statement') {
      portAnchors[port.name] = anchor(id, port.name, 'statement-in', x + width / 2, y);
    }
    // boolean-in (condition): 헤더 우측
    if (port.kind === 'boolean') {
      portAnchors[port.name] = anchor(
        id,
        port.name,
        'boolean-in',
        x + width - 16,
        y + CBLOCK_HEADER_HEIGHT / 2,
      );
    }
  }

  // statement-out (next): 하단 중앙
  for (const port of spec.outputPorts) {
    if (port.kind === 'statement') {
      portAnchors[port.name] = anchor(id, port.name, 'statement-out', x + width / 2, y + height);
    }
  }

  return { id, x, y, width, height, portAnchors, childCavities };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * 단일 블록의 레이아웃을 계산한다.
 *
 * @param node          BlockNode (world 좌표 x, y 포함)
 * @param spec          BlockSpec (shape, ports, childSlots)
 * @param cavityHeights C-block 전용. 각 slot의 children 합산 높이.
 *                      없으면 CBLOCK_CAVITY_MIN_HEIGHT 사용.
 */
export function computeBlockLayout(
  node: BlockNode,
  spec: BlockSpec,
  cavityHeights: Record<string, number> = {},
): BlockLayout {
  switch (spec.shape) {
    case 'hat':     return layoutHat(node, spec);
    case 'stack':   return layoutStack(node, spec);
    case 'boolean': return layoutBoolean(node, spec);
    case 'value':   return layoutValue(node, spec);
    case 'c-block': return layoutCBlock(node, spec, cavityHeights);
  }
}

/**
 * StrategyDocument 전체 블록의 레이아웃을 계산한다.
 *
 * C-block은 children 높이 합산 후 재계산 (bottom-up).
 * 순환 참조가 없다고 가정 (validator가 보장).
 */
export function computeCanvasLayout(doc: StrategyDocument): Record<string, BlockLayout> {
  const layouts: Record<string, BlockLayout> = {};
  const blocks = doc.blocks;

  // 1차 패스: 모든 블록을 기본 cavity 높이(0)로 계산
  for (const node of Object.values(blocks)) {
    const spec = getBlockSpec(node.type);
    layouts[node.id] = computeBlockLayout(node, spec, {});
  }

  // 2차 패스: C-block의 children 높이를 합산해 재계산
  // children이 또 C-block일 수 있으므로 반복 (최대 child 깊이만큼)
  const MAX_PASSES = 10;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;

    for (const node of Object.values(blocks)) {
      if (!node.children) continue;

      const spec = getBlockSpec(node.type);
      const cavityHeights: Record<string, number> = {};

      for (const [slot, childIds] of Object.entries(node.children)) {
        const totalH = childIds.reduce((sum, cid) => {
          const cl = layouts[cid];
          return cl ? sum + cl.height : sum;
        }, 0);
        cavityHeights[slot] = totalH;
      }

      const newLayout = computeBlockLayout(node, spec, cavityHeights);
      if (newLayout.height !== layouts[node.id].height) {
        layouts[node.id] = newLayout;
        changed = true;
      }
    }

    if (!changed) break;
  }

  return layouts;
}

/**
 * C-block cavity의 insertionPoints를 children 레이아웃 기반으로 갱신한다.
 * computeCanvasLayout 이후에 호출.
 */
export function computeCavityInsertionPoints(
  parentLayout: BlockLayout,
  slotName: string,
  childLayouts: BlockLayout[],
): number[] {
  const cavity = parentLayout.childCavities[slotName];
  if (!cavity) return [];

  const points: number[] = [cavity.y]; // 첫 child 위
  let currentY = cavity.y;
  for (const cl of childLayouts) {
    currentY += cl.height;
    points.push(currentY);
  }
  return points;
}
