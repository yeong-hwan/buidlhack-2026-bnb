/**
 * Document model — 편집/저장용 데이터 구조.
 *
 * 이 파일의 타입은 4계층 아키텍처의 "편집기" 계층에 해당한다:
 *   편집기(StrategyDocument) → 검증기 → 컴파일러 → 런타임
 *
 * 좌표계 원칙:
 *   모든 x, y 값은 world 좌표계. screen 좌표 혼용 금지.
 *   변환: worldToScreen(world, zoom, pan), screenToWorld(screen, zoom, pan)
 *
 * Edge vs Child-Slot 규칙:
 *   statement flow  → edge  (prev/next)
 *   value 공급      → edge  (price_of.value → compare.left)
 *   boolean 공급    → edge  (compare.result → if.condition)
 *   nested 소속     → child-slot (buy_market ∈ if.children.then)
 */
import type { BlockData, BlockType } from './data';
import type { SignalType } from './types';

// ── Document Graph (편집/저장용) ─────────────────────────────────────────────

export interface BlockNode {
  id: string;
  type: BlockType;
  data: BlockData;
  /** world 좌표 */
  x: number;
  /** world 좌표 */
  y: number;
  /**
   * C-block 전용 child slot.
   * key: slot 이름 ('then', 'else', 'signals')
   * value: child block id 배열 (순서 보존)
   *
   * edge가 아니라 child-slot으로 저장하는 이유:
   *   nested block의 소속(membership)을 표현하기 때문.
   *   실행 순서도 이 배열의 순서로 결정됨.
   */
  children?: Record<string, string[]>;
}

export interface Edge {
  id: string;
  from: { blockId: string; port: string };
  to: { blockId: string; port: string };
}

export interface StrategyDocument {
  /** key = BlockNode.id */
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
  | 'signal-out'
  | 'child-slot';

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
  selectedBlockIds: string[];
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

// ── Signal (runtime용이지만 document 레벨 타입에서도 참조) ───────────────────

export interface Signal {
  type: SignalType;
  /** 발행한 블록 id */
  source: string;
  /** 0~100 */
  strength: number;
  timestamp: number;
}
