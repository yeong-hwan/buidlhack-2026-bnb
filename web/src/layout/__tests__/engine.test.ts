import { describe, it, expect } from 'vitest';
import { computeBlockLayout, computeCanvasLayout, computeCavityInsertionPoints } from '../engine';
import { getBlockSpec, createBlockNode } from '../../blocks/registry';
import type { StrategyDocument } from '../../blocks/document';
import { screenToWorld, worldToScreen } from '../../blocks/document';
import {
  BLOCK_WIDTH, HAT_HEIGHT, STACK_HEIGHT, BOOLEAN_HEIGHT, VALUE_HEIGHT, VALUE_WIDTH,
  CBLOCK_HEADER_HEIGHT, CBLOCK_FOOTER_HEIGHT, CBLOCK_CAVITY_MIN_HEIGHT, CBLOCK_CAVITY_PADDING,
} from '../constants';

// ── Hat 블록 ──────────────────────────────────────────────────────────────────

describe('computeBlockLayout — hat (every_interval)', () => {
  const node = createBlockNode('every_interval', 100, 200);
  const spec = getBlockSpec('every_interval');
  const layout = computeBlockLayout(node, spec);

  it('크기 확인', () => {
    expect(layout.width).toBe(BLOCK_WIDTH);
    expect(layout.height).toBe(HAT_HEIGHT);
  });

  it('world 좌표 반영', () => {
    expect(layout.x).toBe(100);
    expect(layout.y).toBe(200);
  });

  it('trigger/next anchor — 하단 중앙', () => {
    const triggerAnchor = layout.portAnchors['trigger'] ?? layout.portAnchors['next'];
    expect(triggerAnchor).toBeDefined();
    expect(triggerAnchor.y).toBe(200 + HAT_HEIGHT);
    expect(triggerAnchor.x).toBe(100 + BLOCK_WIDTH / 2);
  });

  it('statement-in(prev) anchor 없음 — hat 블록', () => {
    expect(layout.portAnchors['prev']).toBeUndefined();
  });

  it('childCavities 빈 객체', () => {
    expect(Object.keys(layout.childCavities)).toHaveLength(0);
  });
});

// ── Stack 블록 ────────────────────────────────────────────────────────────────

describe('computeBlockLayout — stack (buy_market)', () => {
  const node = createBlockNode('buy_market', 0, 0);
  const spec = getBlockSpec('buy_market');
  const layout = computeBlockLayout(node, spec);

  it('크기 확인', () => {
    expect(layout.width).toBe(BLOCK_WIDTH);
    expect(layout.height).toBe(STACK_HEIGHT);
  });

  it('prev anchor — 상단 중앙', () => {
    expect(layout.portAnchors['prev']).toBeDefined();
    expect(layout.portAnchors['prev'].y).toBe(0);
    expect(layout.portAnchors['prev'].x).toBe(BLOCK_WIDTH / 2);
    expect(layout.portAnchors['prev'].role).toBe('statement-in');
  });

  it('next anchor — 하단 중앙', () => {
    expect(layout.portAnchors['next']).toBeDefined();
    expect(layout.portAnchors['next'].y).toBe(STACK_HEIGHT);
    expect(layout.portAnchors['next'].x).toBe(BLOCK_WIDTH / 2);
    expect(layout.portAnchors['next'].role).toBe('statement-out');
  });

  it('value-in anchors 존재', () => {
    expect(layout.portAnchors['asset']).toBeDefined();
    expect(layout.portAnchors['amount']).toBeDefined();
  });
});

// ── Boolean 블록 ──────────────────────────────────────────────────────────────

describe('computeBlockLayout — boolean (compare)', () => {
  const node = createBlockNode('compare', 50, 50);
  const spec = getBlockSpec('compare');
  const layout = computeBlockLayout(node, spec);

  it('크기 확인', () => {
    expect(layout.width).toBe(BLOCK_WIDTH);
    expect(layout.height).toBe(BOOLEAN_HEIGHT);
  });

  it('result anchor — 오른쪽 중앙, boolean-out', () => {
    const result = layout.portAnchors['result'];
    expect(result).toBeDefined();
    expect(result.role).toBe('boolean-out');
    expect(result.x).toBe(50 + BLOCK_WIDTH);
    expect(result.y).toBe(50 + BOOLEAN_HEIGHT / 2);
  });

  it('left, right value-in anchor 존재', () => {
    expect(layout.portAnchors['left']).toBeDefined();
    expect(layout.portAnchors['right']).toBeDefined();
    expect(layout.portAnchors['left'].role).toBe('value-in');
    expect(layout.portAnchors['right'].role).toBe('value-in');
  });

  it('childCavities 없음', () => {
    expect(Object.keys(layout.childCavities)).toHaveLength(0);
  });
});

// ── Value 블록 ────────────────────────────────────────────────────────────────

describe('computeBlockLayout — value (price_of)', () => {
  const node = createBlockNode('price_of', 10, 20);
  const spec = getBlockSpec('price_of');
  const layout = computeBlockLayout(node, spec);

  it('크기 확인', () => {
    expect(layout.width).toBe(VALUE_WIDTH);
    expect(layout.height).toBe(VALUE_HEIGHT);
  });

  it('value-out anchor — 오른쪽 중앙', () => {
    const valueOut = layout.portAnchors['value'];
    expect(valueOut).toBeDefined();
    expect(valueOut.role).toBe('value-out');
    expect(valueOut.x).toBe(10 + VALUE_WIDTH);
    expect(valueOut.y).toBe(20 + VALUE_HEIGHT / 2);
  });

  it('statement anchor 없음', () => {
    expect(layout.portAnchors['prev']).toBeUndefined();
    expect(layout.portAnchors['next']).toBeUndefined();
  });
});

// ── C-block ───────────────────────────────────────────────────────────────────

describe('computeBlockLayout — c-block (if)', () => {
  const node = createBlockNode('if', 0, 0);
  const spec = getBlockSpec('if');

  it('기본 높이 (children 없음)', () => {
    const layout = computeBlockLayout(node, spec);
    const expectedH = CBLOCK_HEADER_HEIGHT + (CBLOCK_CAVITY_MIN_HEIGHT + CBLOCK_CAVITY_PADDING * 2) + CBLOCK_FOOTER_HEIGHT;
    expect(layout.height).toBe(expectedH);
  });

  it('prev anchor — 상단 중앙, statement-in', () => {
    const layout = computeBlockLayout(node, spec);
    expect(layout.portAnchors['prev']).toBeDefined();
    expect(layout.portAnchors['prev'].role).toBe('statement-in');
    expect(layout.portAnchors['prev'].y).toBe(0);
    expect(layout.portAnchors['prev'].x).toBe(BLOCK_WIDTH / 2);
  });

  it('next anchor — 하단 중앙, statement-out', () => {
    const layout = computeBlockLayout(node, spec);
    const expectedH = CBLOCK_HEADER_HEIGHT + (CBLOCK_CAVITY_MIN_HEIGHT + CBLOCK_CAVITY_PADDING * 2) + CBLOCK_FOOTER_HEIGHT;
    expect(layout.portAnchors['next']).toBeDefined();
    expect(layout.portAnchors['next'].role).toBe('statement-out');
    expect(layout.portAnchors['next'].y).toBe(expectedH);
  });

  it('condition anchor — 헤더 우측, boolean-in', () => {
    const layout = computeBlockLayout(node, spec);
    expect(layout.portAnchors['condition']).toBeDefined();
    expect(layout.portAnchors['condition'].role).toBe('boolean-in');
    expect(layout.portAnchors['condition'].y).toBe(CBLOCK_HEADER_HEIGHT / 2);
  });

  it('then cavity 존재', () => {
    const layout = computeBlockLayout(node, spec);
    expect(layout.childCavities['then']).toBeDefined();
    expect(layout.childCavities['then'].height).toBeGreaterThanOrEqual(CBLOCK_CAVITY_MIN_HEIGHT);
  });

  it('child 추가 → height 증가 (min 초과)', () => {
    const baseLayout = computeBlockLayout(node, spec);
    // CBLOCK_CAVITY_MIN_HEIGHT(48)보다 큰 값을 넣어야 확장됨
    const withChild = computeBlockLayout(node, spec, { then: CBLOCK_CAVITY_MIN_HEIGHT + STACK_HEIGHT });
    expect(withChild.height).toBeGreaterThan(baseLayout.height);
  });

  it('child 2개 → height 추가 증가', () => {
    const with1 = computeBlockLayout(node, spec, { then: CBLOCK_CAVITY_MIN_HEIGHT + STACK_HEIGHT });
    const with2 = computeBlockLayout(node, spec, { then: CBLOCK_CAVITY_MIN_HEIGHT + STACK_HEIGHT * 2 });
    expect(with2.height).toBeGreaterThan(with1.height);
  });
});

describe('computeBlockLayout — c-block (if_else)', () => {
  const node = createBlockNode('if_else', 0, 0);
  const spec = getBlockSpec('if_else');
  const layout = computeBlockLayout(node, spec);

  it('then, else 두 cavity 모두 존재', () => {
    expect(layout.childCavities['then']).toBeDefined();
    expect(layout.childCavities['else']).toBeDefined();
  });

  it('if_else 기본 높이 > if 기본 높이', () => {
    const ifNode = createBlockNode('if', 0, 0);
    const ifSpec = getBlockSpec('if');
    const ifLayout = computeBlockLayout(ifNode, ifSpec);
    expect(layout.height).toBeGreaterThan(ifLayout.height);
  });
});

// ── computeCanvasLayout ───────────────────────────────────────────────────────

describe('computeCanvasLayout', () => {
  it('빈 document → 빈 레이아웃 맵', () => {
    const doc: StrategyDocument = { blocks: {}, edges: [] };
    expect(Object.keys(computeCanvasLayout(doc))).toHaveLength(0);
  });

  it('단순 블록 2개 → 각 레이아웃 존재', () => {
    const a = createBlockNode('every_interval', 0, 0);
    const b = createBlockNode('buy_market', 0, 100);
    const doc: StrategyDocument = {
      blocks: { [a.id]: a, [b.id]: b },
      edges: [],
    };
    const layouts = computeCanvasLayout(doc);
    expect(layouts[a.id]).toBeDefined();
    expect(layouts[b.id]).toBeDefined();
    expect(layouts[a.id].height).toBe(HAT_HEIGHT);
    expect(layouts[b.id].height).toBe(STACK_HEIGHT);
  });

  it('C-block + child → 자동 확장', () => {
    const ifNode = createBlockNode('if', 0, 0);
    const buyNode = createBlockNode('buy_market', 0, 0);
    ifNode.children = { then: [buyNode.id] };

    const doc: StrategyDocument = {
      blocks: { [ifNode.id]: ifNode, [buyNode.id]: buyNode },
      edges: [],
    };
    const layouts = computeCanvasLayout(doc);
    const baseIfH = CBLOCK_HEADER_HEIGHT + (CBLOCK_CAVITY_MIN_HEIGHT + CBLOCK_CAVITY_PADDING * 2) + CBLOCK_FOOTER_HEIGHT;
    expect(layouts[ifNode.id].height).toBeGreaterThanOrEqual(baseIfH);
  });
});

// ── computeCavityInsertionPoints ──────────────────────────────────────────────

describe('computeCavityInsertionPoints', () => {
  it('children 없을 때 → 상단 1개', () => {
    const node = createBlockNode('if', 0, 0);
    const spec = getBlockSpec('if');
    const layout = computeBlockLayout(node, spec);
    const pts = computeCavityInsertionPoints(layout, 'then', []);
    expect(pts).toHaveLength(1);
  });

  it('children 2개 → 3개 insertion point', () => {
    const node = createBlockNode('if', 0, 0);
    const spec = getBlockSpec('if');
    const layout = computeBlockLayout(node, spec);

    const a = createBlockNode('buy_market', 0, 0);
    const b = createBlockNode('buy_market', 0, 0);
    const aLayout = computeBlockLayout(a, getBlockSpec('buy_market'));
    const bLayout = computeBlockLayout(b, getBlockSpec('buy_market'));

    const pts = computeCavityInsertionPoints(layout, 'then', [aLayout, bLayout]);
    expect(pts).toHaveLength(3);
    // 두 번째 포인트 = 첫 번째 + aLayout.height
    expect(pts[1]).toBe(pts[0] + aLayout.height);
  });
});

// ── 좌표 변환 (document.ts) ────────────────────────────────────────────────────

describe('screenToWorld / worldToScreen 왕복 오차 없음', () => {
  it('zoom=1, pan=(0,0) 항등 변환', () => {
    const pt = { x: 100, y: 200 };
    const world = screenToWorld(pt, 1, { x: 0, y: 0 });
    expect(world).toEqual(pt);
  });

  it('zoom=2, pan=(100,100) 왕복 오차 0', () => {
    const world = { x: 300, y: 400 };
    const zoom = 2;
    const pan = { x: 100, y: 100 };
    const screen = worldToScreen(world, zoom, pan);
    const back = screenToWorld(screen, zoom, pan);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });
});
