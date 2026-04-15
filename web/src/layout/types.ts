import type { PortRole } from '../blocks/document';

// ── PortAnchor ────────────────────────────────────────────────────────────────
//
// layout 계산 결과로 생성되는 world 좌표 기반 anchor.
// DOM 측정값 아님.

export interface PortAnchor {
  blockId: string;
  portName: string;
  role: PortRole;
  /** world 좌표 — layout 계산 결과 */
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── CavityLayout ─────────────────────────────────────────────────────────────
//
// C-block의 child slot 영역.

export interface CavityLayout {
  /** cavity 영역 좌상단 world 좌표 */
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * 각 child 사이 삽입 지점의 y 좌표 (world 좌표).
   * 길이 = child 수 + 1.
   * insertionPoints[0] = cavity 최상단 (첫 child 위)
   * insertionPoints[n] = cavity 최하단 (마지막 child 아래)
   */
  insertionPoints: number[];
}

// ── BlockLayout ───────────────────────────────────────────────────────────────

export interface BlockLayout {
  id: string;
  /** world 좌표 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** key = port name, value = world 좌표 anchor */
  portAnchors: Record<string, PortAnchor>;
  /** key = slot name. C-block 전용. 일반 블록은 빈 객체 */
  childCavities: Record<string, CavityLayout>;
}
