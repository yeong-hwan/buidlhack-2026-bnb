/**
 * Snap Engine — 드래그 중 port 호환성 판단 및 최적 snap target 탐색.
 *
 * canConnect: port role 호환성 + 점유 여부 + 자기연결 차단
 * findBestSnap: 드래그 블록의 모든 output anchor vs 다른 블록의 input anchor
 * shiftLayout: 드래그 중 레이아웃 실시간 이동
 */
import type { PortAnchor } from '../layout/types';
import type { BlockLayout } from '../layout/types';
import type { StrategyDocument } from '../blocks/document';
import type { PortRole } from '../blocks/document';
import { SNAP_THRESHOLD } from '../layout/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SnapResult {
  /** 드래그 블록의 output anchor */
  fromAnchor: PortAnchor;
  /** 대상 블록의 input anchor */
  toAnchor: PortAnchor;
  distance: number;
  /** 드래그 블록 위치 보정값 (world 좌표) — fromAnchor가 toAnchor에 정렬되도록 */
  dx: number;
  dy: number;
}

// ── canConnect ────────────────────────────────────────────────────────────────

const ROLE_COMPAT: Partial<Record<PortRole, PortRole>> = {
  'statement-out': 'statement-in',
  'trigger-out':   'statement-in',
  'boolean-out':   'boolean-in',
  'value-out':     'value-in',
};

/**
 * 두 anchor가 연결 가능한지 판단.
 * - role 호환성
 * - 자기 자신 연결 차단
 * - target port 이미 점유된 경우 차단
 */
export function canConnect(
  from: PortAnchor,
  to: PortAnchor,
  doc: StrategyDocument,
): boolean {
  // 자기 자신
  if (from.blockId === to.blockId) return false;

  // role 호환성
  if (ROLE_COMPAT[from.role] !== to.role) return false;

  // target port 점유 여부
  const occupied = doc.edges.some(
    (e) => e.to.blockId === to.blockId && e.to.port === to.portName,
  );
  if (occupied) return false;

  return true;
}

// ── findBestSnap ──────────────────────────────────────────────────────────────

function isOutputRole(role: PortRole): boolean {
  return role === 'statement-out' || role === 'trigger-out' || role === 'boolean-out' || role === 'value-out';
}

function isInputRole(role: PortRole): boolean {
  return role === 'statement-in' || role === 'boolean-in' || role === 'value-in';
}

/**
 * 드래그 중인 블록의 현재 레이아웃 기준으로 최적 snap 대상을 찾는다.
 *
 * @param draggingLayout 드래그 블록의 현재 레이아웃 (이미 이동된 world 좌표)
 * @param allLayouts     캔버스 전체 블록 레이아웃
 * @param doc            현재 document (edge 점유 여부 확인용)
 * @param threshold      snap 판정 거리 (world unit, 기본 SNAP_THRESHOLD)
 */
export function findBestSnap(
  draggingLayout: BlockLayout,
  allLayouts: Record<string, BlockLayout>,
  doc: StrategyDocument,
  threshold: number = SNAP_THRESHOLD,
): SnapResult | null {
  let best: SnapResult | null = null;

  for (const fromAnchor of Object.values(draggingLayout.portAnchors)) {
    if (!isOutputRole(fromAnchor.role)) continue;

    for (const [blockId, layout] of Object.entries(allLayouts)) {
      if (blockId === draggingLayout.id) continue;

      for (const toAnchor of Object.values(layout.portAnchors)) {
        if (!isInputRole(toAnchor.role)) continue;
        if (!canConnect(fromAnchor, toAnchor, doc)) continue;

        const dist = Math.hypot(fromAnchor.x - toAnchor.x, fromAnchor.y - toAnchor.y);
        if (dist > threshold) continue;
        if (best && dist >= best.distance) continue;

        best = {
          fromAnchor,
          toAnchor,
          distance: dist,
          dx: toAnchor.x - fromAnchor.x,
          dy: toAnchor.y - fromAnchor.y,
        };
      }
    }
  }

  return best;
}

// ── shiftLayout ───────────────────────────────────────────────────────────────

/**
 * 레이아웃 전체를 (dx, dy)만큼 이동한 새 레이아웃 반환.
 * 드래그 중 실시간 위치 추적에 사용.
 */
export function shiftLayout(layout: BlockLayout, dx: number, dy: number): BlockLayout {
  if (dx === 0 && dy === 0) return layout;

  const portAnchors = Object.fromEntries(
    Object.entries(layout.portAnchors).map(([k, a]) => [
      k,
      { ...a, x: a.x + dx, y: a.y + dy },
    ]),
  );
  const childCavities = Object.fromEntries(
    Object.entries(layout.childCavities).map(([k, c]) => [
      k,
      { ...c, x: c.x + dx, y: c.y + dy },
    ]),
  );

  return { ...layout, x: layout.x + dx, y: layout.y + dy, portAnchors, childCavities };
}

// ── generateEdgeId ────────────────────────────────────────────────────────────

export function generateEdgeId(fromBlockId: string, fromPort: string, toBlockId: string, toPort: string): string {
  return `${fromBlockId}.${fromPort}->${toBlockId}.${toPort}`;
}
