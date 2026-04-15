/**
 * Document model — 편집/저장용 데이터 구조.
 *
 * 4계층 아키텍처의 "편집기" 계층:
 *   편집기(StrategyDocument) → 검증기 → 컴파일러 → 런타임
 *
 * ── 좌표계 원칙 ──────────────────────────────────────────────
 *   모든 x, y 값은 world 좌표계. screen 좌표 혼용 금지.
 *   변환: worldToScreen(world, zoom, pan), screenToWorld(screen, zoom, pan)
 *
 * ── Edge vs Child-Slot 규칙 ─────────────────────────────────
 *   statement flow  → edge   (every_interval.next → if.prev)
 *   value 공급      → edge   (price_of.value → compare.left)
 *   boolean 공급    → edge   (compare.result → if.condition)
 *   nested 소속     → child-slot (buy_market ∈ if.children.then)
 *
 *   signal은 edge 아님 — SignalType 매칭으로 SignalBus를 통해 런타임에서만 연결.
 *   emit_signal.signal → when_signal_received 사이에 document edge는 생성하지 않음.
 *
 * ── Child-Slot 내부 statement 순서 원칙 ─────────────────────
 *   child-slot 내 statement 실행 순서 = 배열(children[slot]) 순서.
 *   child 내부에서 statement-to-statement edge는 사용하지 않음.
 *   이중 표현(배열 + edge)을 막아 editor/compiler 충돌을 방지함.
 *
 * ── Literal 값 원칙 ─────────────────────────────────────────
 *   literal(숫자, 문자열, enum 등)은 edge 대상이 아님.
 *   BlockNode.data 필드의 primitive 값으로만 존재.
 *   edge는 block output → block input일 때만 사용.
 *   예: compare.operator='>' 는 data 필드 / price_of.value→compare.left는 edge.
 *
 * ── Orphan 정의 ─────────────────────────────────────────────
 *   orphan = "어떤 root hat 블록으로부터도 도달 불가능한 블록".
 *   단순 미연결과 다름. child-slot 안에 있는 블록은 orphan 아님.
 *   orphan → 컴파일 제외, UI에서 흐린 outline 표시(경고 아님).
 */
import type { BlockData, BlockType, BlockTypeDataMap } from './data';
import type { SignalType } from './types';

// ── BlockNode — Discriminated Union ─────────────────────────────────────────
//
// type + data가 항상 일치하도록 discriminated union으로 정의.
// 예: type='buy_market'이면 data는 반드시 BuyMarketData.
// TypeScript switch(node.type) 문에서 자동 narrowing 가능.

type BlockNodeOf<T extends BlockType> = {
  id: string;
  type: T;
  data: BlockTypeDataMap[T];
  /** world 좌표 */
  x: number;
  /** world 좌표 */
  y: number;
  /**
   * C-block 전용 child slot.
   * key: slot 이름 ('then', 'else', 'signals')
   * value: child block id 배열 (순서 = 실행 순서)
   *
   * child 내부에서 statement-to-statement edge는 사용하지 않음.
   * 배열 순서만으로 statement flow를 표현.
   */
  children?: Record<string, string[]>;
};

export type BlockNode = { [K in BlockType]: BlockNodeOf<K> }[BlockType];

// ── Edge ─────────────────────────────────────────────────────────────────────

export interface Edge {
  id: string;
  from: { blockId: string; port: string };
  to: { blockId: string; port: string };
}

// ── StrategyDocument ─────────────────────────────────────────────────────────

export interface StrategyDocument {
  /** key = BlockNode.id. Record로 O(1) lookup, undo/redo, delete 지원 */
  blocks: Record<string, BlockNode>;
  edges: Edge[];
}

// ── Port Anchor (layout 기반, world 좌표계) ──────────────────────────────────

export type PortRole =
  | 'statement-in'
  | 'statement-out'
  | 'boolean-in'
  | 'boolean-out'
  | 'value-in'
  | 'value-out'
  | 'trigger-out'
  | 'child-slot';
  // signal-out은 SignalBus로 처리. anchor/snap 대상 아님.

export interface PortAnchor {
  blockId: string;
  portName: string;
  role: PortRole;
  /** world 좌표 — layout 계산 결과. DOM 측정값 아님 */
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Validation Error ─────────────────────────────────────────────────────────

export type ValidationLayer = 'shape' | 'type' | 'semantics';
export type ValidationSeverity = 'error' | 'warning';

export interface ValidationError {
  blockId: string;
  portName?: string;
  layer: ValidationLayer;
  severity: ValidationSeverity;
  message: string;
}

// ── Editor State ─────────────────────────────────────────────────────────────
//
// MVP 범위: undo/redo, selectedBlockIds, when_news_arrives는 Phase 1에서 제외.
// 구조에는 포함하되 초기 구현에서 기능 구현은 보류.

export interface EditorState {
  document: StrategyDocument;
  draggingBlockId: string | null;
  hoverSnapTarget: {
    blockId: string;
    portName: string;
  } | null;
  /** canvas zoom level (1.0 = 100%) */
  zoom: number;
  /** canvas pan offset, world 좌표 기준 */
  pan: { x: number; y: number };
  validationErrors: ValidationError[];
}

// ── Coordinate Utilities ─────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export function screenToWorld(screen: Point, zoom: number, pan: Point): Point {
  return {
    x: (screen.x - pan.x) / zoom,
    y: (screen.y - pan.y) / zoom,
  };
}

export function worldToScreen(world: Point, zoom: number, pan: Point): Point {
  return {
    x: world.x * zoom + pan.x,
    y: world.y * zoom + pan.y,
  };
}

// ── Signal ───────────────────────────────────────────────────────────────────
//
// document 레벨에서 signal은 edge를 생성하지 않음.
// emit_signal(signalType='ENTRY')과 when_signal_received(signalType='ENTRY')는
// SignalType 값이 같으면 런타임 SignalBus를 통해 자동 연결됨.
// 편집기에서 화살표 연결선을 그리지 않는다.

export interface Signal {
  type: SignalType;
  /** 발행한 블록 id */
  source: string;
  /** 0~100 */
  strength: number;
  timestamp: number;
}

// ── 타입 유틸리티 ────────────────────────────────────────────────────────────

/** BlockNode에서 특정 type을 가진 노드로 narrowing */
export function isBlockOfType<T extends BlockType>(
  node: BlockNode,
  type: T,
): node is Extract<BlockNode, { type: T }> {
  return node.type === type;
}

/** StrategyDocument에서 root hat 블록 목록 반환 */
export function getRootBlocks(doc: StrategyDocument): BlockNode[] {
  return Object.values(doc.blocks).filter(
    (b) => b.type === 'every_interval' ||
           b.type === 'when_signal_received' ||
           b.type === 'when_news_arrives' ||
           b.type === 'manual_run',
  );
}
